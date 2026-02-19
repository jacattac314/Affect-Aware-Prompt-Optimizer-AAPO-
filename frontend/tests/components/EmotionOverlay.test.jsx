import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmotionOverlay from '../../src/components/EmotionOverlay';

describe('EmotionOverlay', () => {
  test('renders emotion label with correct capitalization', () => {
    render(<EmotionOverlay emotion="happy" posture="upright" />);
    expect(screen.getByText('Happy')).toBeInTheDocument();
  });

  test('renders intent for angry + slouching', () => {
    render(<EmotionOverlay emotion="angry" posture="slouching" />);
    expect(screen.getByText(/FRUSTRATED/)).toBeInTheDocument();
  });

  test('renders intent for neutral + upright', () => {
    render(<EmotionOverlay emotion="neutral" posture="upright" />);
    expect(screen.getByText(/NEUTRAL/)).toBeInTheDocument();
  });

  test('renders tone suggestion text', () => {
    render(<EmotionOverlay emotion="sad" posture="head-down" />);
    expect(screen.getByText(/suggested tone/i)).toBeInTheDocument();
  });

  test('renders emoji with accessible aria-label', () => {
    render(<EmotionOverlay emotion="happy" posture="upright" />);
    expect(screen.getByRole('img', { name: /detected emotion: happy/i })).toBeInTheDocument();
  });

  test('renders posture label', () => {
    render(<EmotionOverlay emotion="neutral" posture="slouching" />);
    expect(screen.getByText('slouching')).toBeInTheDocument();
  });
});
