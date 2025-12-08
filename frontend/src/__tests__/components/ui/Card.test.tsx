import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../../../components/ui/Card';

describe('Card (TypeScript)', () => {
  it('should render card with children', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should have card class', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('.card');
    expect(card).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.querySelector('.card.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should support multiple children', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should support HTML attributes', () => {
    const { container } = render(
      <Card data-testid="test-card" id="my-card">
        Content
      </Card>
    );
    expect(container.querySelector('[data-testid="test-card"]')).toBeInTheDocument();
    expect(container.querySelector('#my-card')).toBeInTheDocument();
  });

  it('should work with complex children', () => {
    render(
      <Card>
        <div>
          <h3>Section 1</h3>
          <p>Content 1</p>
        </div>
        <div>
          <h3>Section 2</h3>
          <p>Content 2</p>
        </div>
      </Card>
    );
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });
});
