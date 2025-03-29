import TunerClient from "../components/TunerClient";

export default function Tuner() {
  return (
    <main>
      <section>
        <h1>オンラインチューナー</h1>
        <p>
          このページではリアルタイムのオーディオ解析により、ギターやベースの
          チューニングを行えます。マイクのアクセス許可が必要ですが、まずは
          この静的コンテンツをご覧ください。
        </p>
      </section>
      <TunerClient />
    </main>
  );
}
