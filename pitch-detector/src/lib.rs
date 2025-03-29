use wasm_bindgen::prelude::*;

const MIN_FREQ: f32 = 20.0;
const MAX_FREQ: f32 = 2000.0;
const CORRELATION_THRESHOLD: f32 = 0.8;
const MIN_SIGNAL_STRENGTH: f32 = 0.001;

#[wasm_bindgen]
pub struct PitchDetector {
    buffer: Vec<f32>,
    sample_rate: f32,
    moving_average: Vec<f32>,
    buffer_size: usize,
}

#[wasm_bindgen]
impl PitchDetector {
    pub fn new(sample_rate: f32, buffer_size: usize) -> Self {
        Self {
            buffer: vec![0.0; buffer_size],
            sample_rate,
            moving_average: Vec::with_capacity(4),
            buffer_size,
        }
    }

    pub fn detect_pitch(&mut self, input: &[f32]) -> f32 {
        // バッファの更新
        if input.len() != self.buffer_size {
            web_sys::console::log_1(&format!("Input length mismatch: expected {}, got {}", self.buffer_size, input.len()).into());
            return 0.0;
        }

        // バッファのコピー
        self.buffer.copy_from_slice(input);

        // 信号強度のチェック
        let strength = self.check_signal_strength();
        if !strength {
            return 0.0;
        }

        // 自己相関関数の計算
        let correlation = self.calculate_autocorrelation();

        // ピークの検出と補間
        if let Some(freq) = self.find_fundamental_frequency(&correlation) {
            // 移動平均の更新
            self.update_moving_average(freq);
            let result = self.get_median_frequency();
            web_sys::console::log_1(&format!("Detected frequency: {}", result).into());
            result
        } else {
            0.0
        }
    }

    fn check_signal_strength(&self) -> bool {
        let strength: f32 = self.buffer.iter()
            .map(|&x| x * x)
            .sum::<f32>()
            .sqrt() / (self.buffer_size as f32).sqrt();
        
        web_sys::console::log_1(&format!("Signal strength: {}", strength).into());
        strength > MIN_SIGNAL_STRENGTH
    }

    fn calculate_autocorrelation(&self) -> Vec<f32> {
        let mut result = vec![0.0; self.buffer_size];
        let buffer = &self.buffer;
        
        // 自己相関関数の計算（最適化版）
        for lag in 0..self.buffer_size {
            let mut sum = 0.0;
            let max_i = self.buffer_size - lag;
            
            // 通常のループ（より安全な実装）
            for i in 0..max_i {
                sum += buffer[i] * buffer[i + lag];
            }
            
            result[lag] = sum;
        }

        // 正規化
        if let Some(&max_value) = result.iter().max_by(|a, b| a.partial_cmp(b).unwrap()) {
            if max_value > 0.0 {
                for value in result.iter_mut() {
                    *value /= max_value;
                }
            }
        }

        result
    }

    fn find_fundamental_frequency(&self, correlation: &[f32]) -> Option<f32> {
        let min_lag = (self.sample_rate / MAX_FREQ) as usize;
        let max_lag = ((self.sample_rate / MIN_FREQ) as usize).min(correlation.len() - 3);

        let mut max_correlation = 0.0;
        let mut peak_index = 0;

        // ピーク検出（安全な実装）
        for i in min_lag..=max_lag {
            let current = correlation[i];
            let prev = correlation[i - 1];
            let next = correlation[i + 1];

            if current > max_correlation && current > prev && current > next {
                max_correlation = current;
                peak_index = i;
            }
        }

        if max_correlation > CORRELATION_THRESHOLD {
            let interpolated_index = self.interpolate_peak(correlation, peak_index);
            Some(self.sample_rate / interpolated_index)
        } else {
            None
        }
    }

    fn interpolate_peak(&self, data: &[f32], peak_index: usize) -> f32 {
        if peak_index == 0 || peak_index >= data.len() - 1 {
            return peak_index as f32;
        }

        let y0 = data[peak_index - 1];
        let y1 = data[peak_index];
        let y2 = data[peak_index + 1];

        let a = (y0 + y2 - 2.0 * y1) / 2.0;
        let b = (y2 - y0) / 2.0;

        if a.abs() < 1e-6 {
            peak_index as f32
        } else {
            -b / (2.0 * a) + peak_index as f32
        }
    }

    fn update_moving_average(&mut self, freq: f32) {
        self.moving_average.push(freq);
        if self.moving_average.len() > 4 {
            self.moving_average.remove(0);
        }
    }

    fn get_median_frequency(&self) -> f32 {
        if self.moving_average.is_empty() {
            return 0.0;
        }
        let mut sorted = self.moving_average.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        sorted[sorted.len() / 2]
    }
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
} 