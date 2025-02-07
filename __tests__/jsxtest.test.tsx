import { render, screen } from '@testing-library/react';

const TestComponent = () => {
  return <div
    data-testid="title"
  > Hello, World!</div >;
};

test('renders TestComponent with correct text', () => {
  render(<TestComponent />);
  const title = screen.getByTestId("title")
  expect(title).toHaveTextContent("Hello, World!")
});