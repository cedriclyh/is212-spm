// src/tests/test_BlockoutPopup.js
import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import axios from 'axios';
import BlockoutPopup from '../component/CalendarView/BlockoutPopup';


describe('BlockoutPopup Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Opening and Closing', () => {
        it('should open popup when clicking Block Out Dates button', () => {
            render(<BlockoutPopup />);
            const button = screen.getByRole('button', { name: /block out dates/i });
            fireEvent.click(button);
            expect(screen.getByText('Create Blockout')).toBeInTheDocument();
        });

        it('should close popup without confirmation when form is empty', () => {
            render(<BlockoutPopup />);
            fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));
            fireEvent.click(screen.getByRole('button', { name: /close/i }));
            expect(screen.queryByText('Create Blockout')).not.toBeInTheDocument();
            expect(window.confirm).not.toHaveBeenCalled();
        });

        it('should show confirmation dialog when closing with filled form', () => {
            render(<BlockoutPopup />);
            fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));

            // Fill a field
            fireEvent.change(screen.getByLabelText('Title:'), {
                target: { value: 'Test Title' }
            });

            fireEvent.click(screen.getByRole('button', { name: /close/i }));
            expect(window.confirm).toHaveBeenCalledWith(
                'Are you sure you want to close the popup? All changes will be lost.'
            );
        });

        it('should not close popup if confirmation is declined', () => {
            window.confirm.mockImplementationOnce(() => false);
            render(<BlockoutPopup />);
            fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));

            fireEvent.change(screen.getByLabelText('Title:'), {
                target: { value: 'Test Title' }
            });

            fireEvent.click(screen.getByRole('button', { name: /close/i }));
            expect(screen.getByText('Create Blockout')).toBeInTheDocument();
        });
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            render(<BlockoutPopup />);
            fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));
        });

        it('should validate empty fields', () => {
            fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            expect(screen.getByText('Title is required.')).toBeInTheDocument();
            expect(screen.getByText('Start date is required.')).toBeInTheDocument();
            expect(screen.getByText('End date is required.')).toBeInTheDocument();
        });

        it('should validate date range', () => {
            fireEvent.change(screen.getByLabelText('Start Date:'), {
                target: { value: '2024-10-16' }
            });
            fireEvent.change(screen.getByLabelText('End Date:'), {
                target: { value: '2024-10-15' }
            });

            fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            expect(screen.getByText('End date cannot be earlier than start date.')).toBeInTheDocument();
        });

        it('should clear validation errors when input is corrected', async () => {
            // Submit empty form to trigger errors
            fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            expect(screen.getByText('Title is required.')).toBeInTheDocument();

            // Fix the error
            fireEvent.change(screen.getByLabelText('Title:'), {
                target: { value: 'Test Title' }
            });

            await waitFor(() => {
                expect(screen.queryByText('Title is required.')).not.toBeInTheDocument();
            });
        });

        it('should clear date validation error when dates are corrected', async () => {
            // Set invalid dates
            fireEvent.change(screen.getByLabelText('Start Date:'), {
                target: { value: '2024-10-16' }
            });
            fireEvent.change(screen.getByLabelText('End Date:'), {
                target: { value: '2024-10-15' }
            });

            fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            expect(screen.getByText('End date cannot be earlier than start date.')).toBeInTheDocument();

            // Fix the dates
            fireEvent.change(screen.getByLabelText('End Date:'), {
                target: { value: '2024-10-17' }
            });

            await waitFor(() => {
                expect(screen.queryByText('End date cannot be earlier than start date.')).not.toBeInTheDocument();
            });
        });
    });

    describe('Timeslot Selection', () => {
        beforeEach(() => {
            render(<BlockoutPopup />);
            fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));
        });

        it('should have FULL as default timeslot', () => {
            // Check the dropdown trigger button shows FULL
            const triggerButton = screen.getByRole('button', {
                name: /full/i,
                exact: false
            });
            expect(triggerButton).toBeInTheDocument();

            // Check the select has FULL as the selected value
            const select = screen.getByRole('combobox');
            expect(select).toHaveValue('FULL');
        });

        it('should handle timeslot changes', async () => {
            // Find and change the select value
            const select = screen.getByRole('combobox');
            await act(async () => {
                fireEvent.change(select, { target: { value: 'AM' } });
            });

            // Wait for both the trigger button and select to update
            await waitFor(() => {
                const triggerButton = screen.getByRole('button', {
                    name: /am/i,
                    exact: false
                });
                expect(triggerButton).toBeInTheDocument();
                expect(select).toHaveValue('AM');
            });
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            render(<BlockoutPopup />);
            fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));
        });

        it('should handle successful submission with optional description', async () => {
            axios.post.mockResolvedValueOnce({ status: 200 });

            // Fill form with description
            fireEvent.change(screen.getByLabelText('Title:'), {
                target: { value: 'Test Blockout' }
            });
            fireEvent.change(screen.getByLabelText('Start Date:'), {
                target: { value: '2024-10-15' }
            });
            fireEvent.change(screen.getByLabelText('End Date:'), {
                target: { value: '2024-10-16' }
            });
            fireEvent.change(screen.getByLabelText(/description/i), {
                target: { value: 'Test Description' }
            });

            fireEvent.click(screen.getByRole('button', { name: /submit/i }));

            await waitFor(() => {
                expect(axios.post).toHaveBeenCalledWith(
                    'http://localhost:5012/manage_blockout',
                    expect.objectContaining({
                        title: 'Test Blockout',
                        start_date: '2024-10-15',
                        end_date: '2024-10-16',
                        blockout_description: 'Test Description'
                    })
                );
            });
        });

        it('should handle different error responses', async () => {
            // Test 409 conflict error
            axios.post.mockRejectedValueOnce({
                response: { status: 409 }
            });

            fireEvent.change(screen.getByLabelText('Title:'), {
                target: { value: 'Test Blockout' }
            });
            fireEvent.change(screen.getByLabelText('Start Date:'), {
                target: { value: '2024-10-15' }
            });
            fireEvent.change(screen.getByLabelText('End Date:'), {
                target: { value: '2024-10-16' }
            });

            fireEvent.click(screen.getByRole('button', { name: /submit/i }));

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith(
                    'Failed to create blockout. At least one blockout already exists within the selected date range.'
                );
            });

            // Test other error
            window.alert.mockClear();
            axios.post.mockRejectedValueOnce({
                response: { status: 500 }
            });

            fireEvent.click(screen.getByRole('button', { name: /submit/i }));

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith('Failed to create blockout');
            });
        });
    });

    describe('Form Reset', () => {
        it('should reset all form fields after successful submission', async () => {
            axios.post.mockResolvedValueOnce({ status: 200 });
            render(<BlockoutPopup />);
            fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));

            // Fill all fields
            fireEvent.change(screen.getByLabelText('Title:'), {
                target: { value: 'Test Blockout' }
            });
            fireEvent.change(screen.getByLabelText('Start Date:'), {
                target: { value: '2024-10-15' }
            });
            fireEvent.change(screen.getByLabelText('End Date:'), {
                target: { value: '2024-10-16' }
            });
            fireEvent.change(screen.getByLabelText(/description/i), {
                target: { value: 'Test Description' }
            });

            fireEvent.click(screen.getByRole('button', { name: /submit/i }));

            await waitFor(() => {
                expect(screen.queryByText('Create Blockout')).not.toBeInTheDocument();
            });

            // Reopen popup and verify fields are reset
            fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));
            expect(screen.getByLabelText('Title:')).toHaveValue('');
            expect(screen.getByLabelText('Start Date:')).toHaveValue('');
            expect(screen.getByLabelText('End Date:')).toHaveValue('');
            expect(screen.getByLabelText(/description/i)).toHaveValue('');
        });
    });

    describe('Form State Management', () => {
        beforeEach(async () => {
            render(<BlockoutPopup />);
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));
            });
        });

        it('should keep popup open when confirm dialog is rejected', async () => {
            // Fill form to trigger confirmation
            await act(async () => {
                fireEvent.change(screen.getByLabelText('Title:'), {
                    target: { value: 'Test Title' }
                });
            });

            // Mock confirm to return false (user clicks "Cancel")
            window.confirm.mockImplementationOnce(() => false);

            // Try to close
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /close/i }));
            });

            // Verify popup stays open
            expect(screen.getByText('Create Blockout')).toBeInTheDocument();
            expect(screen.getByLabelText('Title:')).toHaveValue('Test Title');
        });

        it('should handle date validation when end date is updated', async () => {
            // Set valid dates first
            await act(async () => {
                fireEvent.change(screen.getByLabelText('Start Date:'), {
                    target: { value: '2024-10-15' }
                });
                fireEvent.change(screen.getByLabelText('End Date:'), {
                    target: { value: '2024-10-16' }
                });
            });

            // Change end date to invalid date
            await act(async () => {
                fireEvent.change(screen.getByLabelText('End Date:'), {
                    target: { value: '2024-10-14' }
                });
            });

            // Submit to trigger validation
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            });

            expect(screen.getByText('End date cannot be earlier than start date.')).toBeInTheDocument();
        });

        it('should clear start date validation error when fixed', async () => {
            // Submit empty form to trigger errors
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            });

            expect(screen.getByText('Start date is required.')).toBeInTheDocument();

            // Fix start date
            await act(async () => {
                fireEvent.change(screen.getByLabelText('Start Date:'), {
                    target: { value: '2024-10-15' }
                });
            });

            expect(screen.queryByText('Start date is required.')).not.toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        beforeEach(async () => {
            render(<BlockoutPopup />);
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));
            });
        });

        it('should handle generic server error', async () => {
            // Mock a generic error response
            axios.post.mockRejectedValueOnce({
                response: { status: 500 }
            });

            // Fill and submit form
            await act(async () => {
                fireEvent.change(screen.getByLabelText('Title:'), {
                    target: { value: 'Test Blockout' }
                });
                fireEvent.change(screen.getByLabelText('Start Date:'), {
                    target: { value: '2024-10-15' }
                });
                fireEvent.change(screen.getByLabelText('End Date:'), {
                    target: { value: '2024-10-16' }
                });
            });

            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            });

            expect(window.alert).toHaveBeenCalledWith('Failed to create blockout');
        });

        it('should handle network error', async () => {
            // Mock a network error
            axios.post.mockRejectedValueOnce(new Error('Network Error'));

            // Fill and submit form
            await act(async () => {
                fireEvent.change(screen.getByLabelText('Title:'), {
                    target: { value: 'Test Blockout' }
                });
                fireEvent.change(screen.getByLabelText('Start Date:'), {
                    target: { value: '2024-10-15' }
                });
                fireEvent.change(screen.getByLabelText('End Date:'), {
                    target: { value: '2024-10-16' }
                });
            });

            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            });

            expect(window.alert).toHaveBeenCalledWith('Failed to create blockout');
        });
    });

    describe('Complex Validation Scenarios', () => {
        beforeEach(async () => {
            render(<BlockoutPopup />);
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /block out dates/i }));
            });
        });

        it('should validate and clear end date error when corrected', async () => {
            // Set up scenario where end date is before start date
            await act(async () => {
                fireEvent.change(screen.getByLabelText('Start Date:'), {
                    target: { value: '2024-10-15' }
                });
                fireEvent.change(screen.getByLabelText('End Date:'), {
                    target: { value: '2024-10-14' }
                });
            });

            // Submit to trigger validation
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: /submit/i }));
            });

            expect(screen.getByText('End date cannot be earlier than start date.')).toBeInTheDocument();

            // Fix the end date
            await act(async () => {
                fireEvent.change(screen.getByLabelText('End Date:'), {
                    target: { value: '2024-10-16' }
                });
            });

            expect(screen.queryByText('End date cannot be earlier than start date.')).not.toBeInTheDocument();
        });
    });
});