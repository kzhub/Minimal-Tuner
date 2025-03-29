use wasm_bindgen::prelude::*;
use web_sys::{AudioContext, AnalyserNode, MediaStreamAudioSourceNode};
use js_sys::Float32Array;
use std::f32::consts::PI;

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
            .sqrt() / self.buffer_size as f32;
        
        web_sys::console::log_1(&format!("Signal strength: {}", strength).into());
        strength > MIN_SIGNAL_STRENGTH
    }

    fn calculate_autocorrelation(&self) -> Vec<f32> {
        let mut result = vec![0.0; self.buffer.len()];
        
        // 自己相関関数の計算（最適化版）
        for lag in 0..self.buffer.len() {
            let mut sum = 0.0;
            let mut i = 0;
            
            // ベクトル化可能なループ
            while i + 4 <= self.buffer.len() - lag {
                sum += self.buffer[i] * self.buffer[i + lag]
                    + self.buffer[i + 1] * self.buffer[i + lag + 1]
                    + self.buffer[i + 2] * self.buffer[i + lag + 2]
                    + self.buffer[i + 3] * self.buffer[i + lag + 3];
                i += 4;
            }
            
            // 残りの要素を処理
            while i < self.buffer.len() - lag {
                sum += self.buffer[i] * self.buffer[i + lag];
                i += 1;
            }
            
            result[lag] = sum;
        }

        result
    }

    fn find_fundamental_frequency(&self, correlation: &[f32]) -> Option<f32> {
        let min_lag = (self.sample_rate / MAX_FREQ) as usize;
        let max_lag = (self.sample_rate / MIN_FREQ) as usize;

        let mut max_correlation = f32::NEG_INFINITY;
        let mut peak_index = 0;

        // ピーク検出（最適化版）
        for i in min_lag..max_lag {
            if correlation[i] > max_correlation &&
               correlation[i] > correlation[i - 1] &&
               correlation[i] > correlation[i + 1] {
                max_correlation = correlation[i];
                peak_index = i;
            }
        }

        if max_correlation > CORRELATION_THRESHOLD {
            // 3次スプライン補間による高精度なピーク位置の計算
            let interpolated_index = self.interpolate_peak(correlation, peak_index);
            Some(self.sample_rate / interpolated_index)
        } else {
            None
        }
    }

    fn interpolate_peak(&self, data: &[f32], peak_index: usize) -> f32 {
        let x = peak_index as f32;
        let y0 = data[peak_index - 1];
        let y1 = data[peak_index];
        let y2 = data[peak_index + 1];

        // より高精度な補間計算
        let a = (y0 + y2 - 2.0 * y1) / 2.0;
        let b = (y2 - y0) / 2.0;
        let c = y1;

        // 二次関数の頂点を計算
        -b / (2.0 * a) + x
    }

    fn update_moving_average(&mut self, freq: f32) {
        self.moving_average.push(freq);
        if self.moving_average.len() > 4 {
            self.moving_average.remove(0);
        }
    }

    fn get_median_frequency(&self) -> f32 {
        let mut sorted = self.moving_average.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        sorted[sorted.len() / 2]
    }
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
} 