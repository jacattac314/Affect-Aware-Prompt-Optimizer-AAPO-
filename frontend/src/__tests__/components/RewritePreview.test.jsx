import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RewritePreview from '../../components/RewritePreview';
import { AppProvider, useAppContext } from '../../context/AppContext';

// Stub the Clipboard API — not available in jsdom.
Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

function renderWithContext(ui) {
  return render(<AppProvider>{ui}</AppProvider>);
}

/**
 * Mini wrapper that mirrors App.jsx's conditional rendering:
 * RewritePreview is only shown when context.rewrittenPrompt is non-empty.
 * Clicking Accept/Discard inside the component clears it, causing unmount.
 */
function ContextDrivenPreview({ initialPrompt }) {
  const { rewrittenPrompt, setRewrittenPrompt } = useAppContext();

  React.useEffect(() => {
    setRewrittenPrompt(initialPrompt);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rewrittenPrompt) return null;
  return <RewritePreview rewrittenPrompt={rewrittenPrompt} isLoading={false} />;
}

function renderContextDriven(initialPrompt) {
  return render(
    <AppProvider>
      <ContextDrivenPreview initialPrompt={initialPrompt} />
    </AppProvider>
  );
}

describe('RewritePreview', () => {
  const SAMPLE = 'Could you please help me understand this better?';

  test('renders the rewritten prompt text', () => {
    renderWithContext(<RewritePreview rewrittenPrompt={SAMPLE} isLoading={false} />);
    expect(screen.getByText(SAMPLE)).toBeInTheDocument();
  });

  test('shows skeleton loader while loading', () => {
    renderWithContext(<RewritePreview rewrittenPrompt="" isLoading={true} />);
    expect(screen.getByLabelText(/loading rewritten prompt/i)).toBeInTheDocument();
  });

  test('hides action buttons while loading', () => {
    renderWithContext(<RewritePreview rewrittenPrompt="" isLoading={true} />);
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
  });

  test('Accept button clears the rewritten prompt from context — component unmounts', () => {
    renderContextDriven(SAMPLE);
    expect(screen.getByText(SAMPLE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(screen.queryByText(SAMPLE)).not.toBeInTheDocument();
  });

  test('Copy button calls clipboard.writeText with the rewritten prompt', async () => {
    renderWithContext(<RewritePreview rewrittenPrompt={SAMPLE} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLE);
  });

  test('Discard button clears the rewritten prompt from context — component unmounts', () => {
    renderContextDriven(SAMPLE);
    expect(screen.getByText(SAMPLE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /discard/i }));
    expect(screen.queryByText(SAMPLE)).not.toBeInTheDocument();
  });

  test('has accessible live region for screen readers', () => {
    renderWithContext(<RewritePreview rewrittenPrompt={SAMPLE} isLoading={false} />);
    const region = screen.getByRole('region', { name: /rewritten prompt/i });
    expect(region).toBeInTheDocument();
  });
});
