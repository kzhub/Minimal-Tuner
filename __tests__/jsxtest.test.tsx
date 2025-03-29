import { render, screen } from '@testing-library/react';

const TestComponent = () => {
  return <div
    data-testid="title"
  > Hello, World!</div >;
};

describe('コンポーネントのレンダリングテスト', () => {
  test('TestComponentが正しくレンダリングされ、Hello, World!というテキストが表示される', () => {
    render(<TestComponent />);
    const title = screen.getByTestId("title")
    expect(title).toHaveTextContent("Hello, World!")
  });
});