import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../../components/ui/Input';

describe('Input (TypeScript)', () => {
  it('should render input element', () => {
    render(<Input id="test-input" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should display label when provided', () => {
    render(<Input id="email" label="Email Address" type="email" />);
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <Input
        id="password"
        label="Password"
        type="password"
        error="Password is required"
      />
    );
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('should have error class when error is provided', () => {
    const { container } = render(
      <Input id="test" error="Error message" />
    );
    const input = container.querySelector('.input-error');
    expect(input).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input id="test" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should support email input type', () => {
    render(<Input id="test" type="email" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('should handle user input', async () => {
    const user = userEvent.setup();
    render(<Input id="test" type="text" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    await user.type(input, 'test@example.com');
    expect(input.value).toBe('test@example.com');
  });

  it('should have aria-invalid when error exists', () => {
    render(<Input id="test" error="Invalid input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should have aria-describedby pointing to error message', () => {
    render(<Input id="email" error="Email is invalid" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('should support placeholder attribute', () => {
    render(<Input id="test" placeholder="Enter text..." />);
    const input = screen.getByPlaceholderText('Enter text...');
    expect(input).toBeInTheDocument();
  });

  it('should apply form-input class when no error', () => {
    const { container } = render(<Input id="test" />);
    const input = container.querySelector('.form-input');
    expect(input).toBeInTheDocument();
  });

  it('should support aria-invalid false when no error', () => {
    render(<Input id="test" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });
});
