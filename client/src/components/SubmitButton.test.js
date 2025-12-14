import React from 'react';
import { render } from '@testing-library/react';
import SubmitButton from './SubmitButton';

test('renders submit button', () => {
  const { container } = render(<SubmitButton />);
  const buttonElement = container.querySelector('button');
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveClass('link--arrowed');
});
