import FormField from '@/components/ui/FormField';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

describe('FormField', () => {
  it('renders the label correctly', () => {
    const { getByText } = render(
      <FormField label="Email" value="" onChangeText={() => {}} />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders the placeholder correctly', () => {
    const { getByPlaceholderText } = render(
      <FormField label="Email" value="" onChangeText={() => {}} placeholder="Enter your email" />
    );
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
  });

  it('calls onChangeText when user types', () => {
    const mockOnChange = jest.fn();
    const { getByLabelText } = render(
      <FormField label="Name" value="" onChangeText={mockOnChange} />
    );

    const input = getByLabelText('Name');
    fireEvent.changeText(input, 'Roberto');
    expect(mockOnChange).toHaveBeenCalledWith('Roberto');
  });

  it('uses label as default placeholder when none provided', () => {
    const { getByPlaceholderText } = render(
      <FormField label="Username" value="" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Username')).toBeTruthy();
  });
});