import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import BlockoutPopup from '../component/CalendarView/BlockoutPopup';

describe('BlockoutPopup Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should open and close popup', async () => {
        render(<BlockoutPopup />);

        // Open popup using the button's text content
        const openButton = screen.getByRole('button', { name: /block out dates/i });
        fireEvent.click(openButton);

        expect(screen.getByText('Create Blockout')).toBeInTheDocument();

        // Close popup
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText('Create Blockout')).not.toBeInTheDocument();
        });
    });

    it('should validate form inputs', async () => {
        render(<BlockoutPopup />);

        // Open popup
        const openButton = screen.getByRole('button', { name: /block out dates/i });
        fireEvent.click(openButton);

        // Submit empty form
        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Title is required.')).toBeInTheDocument();
            expect(screen.getByText('Start date is required.')).toBeInTheDocument();
            expect(screen.getByText('End date is required.')).toBeInTheDocument();
        });
    });

    it('should handle successful form submission', async () => {
        axios.post.mockResolvedValueOnce({ status: 200 });

        render(<BlockoutPopup />);
        const openButton = screen.getByRole('button', { name: /block out dates/i });
        fireEvent.click(openButton);

        // Fill form
        fireEvent.change(screen.getByLabelText(/title/i), {
            target: { value: 'Test Blockout' }
        });

        fireEvent.change(screen.getByLabelText(/start date/i), {
            target: { value: '2024-10-15' }
        });

        fireEvent.change(screen.getByLabelText(/end date/i), {
            target: { value: '2024-10-16' }
        });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                'http://localhost:5012/manage_blockout',
                expect.objectContaining({
                    title: 'Test Blockout',
                    start_date: '2024-10-15',
                    end_date: '2024-10-16',
                    timeslot: expect.any(Object),
                    blockout_description: ''
                })
            );
            expect(window.alert).toHaveBeenCalledWith('Blockout created successfully');
        });
    });

    it('should handle server error', async () => {
        axios.post.mockRejectedValueOnce({
            response: { status: 409 }
        });

        render(<BlockoutPopup />);
        const openButton = screen.getByRole('button', { name: /block out dates/i });
        fireEvent.click(openButton);

        // Fill form
        fireEvent.change(screen.getByLabelText(/title/i), {
            target: { value: 'Test Blockout' }
        });

        fireEvent.change(screen.getByLabelText(/start date/i), {
            target: { value: '2024-10-15' }
        });

        fireEvent.change(screen.getByLabelText(/end date/i), {
            target: { value: '2024-10-16' }
        });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(
                'Failed to create blockout. At least one blockout already exists within the selected date range.'
            );
        });
    });
});