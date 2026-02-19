import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PromptEditor from '../../components/PromptEditor';
import { AppProvider } from '../../context/AppContext';

function renderWithContext(ui) {
  return render(<AppProvider>{ui}</AppProvider>);
}

describe('PromptEditor', () => {
  test('renders textarea and improve button', () => {
    renderWithContext(<PromptEditor onImprove={jest.fn()} isLoading={false} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /improve my prompt/i })).toBeInTheDocument();
  });

  test('button is disabled when textarea is empty', () => {
    renderWithContext(<PromptEditor onImprove={jest.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: /improve my prompt/i })).toBeDisabled();
  });

  test('button is enabled after typing', () => {
    renderWithContext(<PromptEditor onImprove={jest.fn()} isLoading={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } });
    expect(screen.getByRole('button', { name: /improve my prompt/i })).toBeEnabled();
  });

  test('calls onImprove when button is clicked', () => {
    const onImprove = jest.fn();
    renderWithContext(<PromptEditor onImprove={onImprove} isLoading={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test prompt' } });
    fireEvent.click(screen.getByRole('button', { name: /improve my prompt/i }));
    expect(onImprove).toHaveBeenCalledTimes(1);
  });

  test('shows "Rewriting..." and disables inputs while loading', () => {
    renderWithContext(<PromptEditor onImprove={jest.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: /rewriting/i })).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('displays character count', () => {
    renderWithContext(<PromptEditor onImprove={jest.fn()} isLoading={false} />);
    expect(screen.getByText(/remaining/i)).toBeInTheDocument();
  });
});
