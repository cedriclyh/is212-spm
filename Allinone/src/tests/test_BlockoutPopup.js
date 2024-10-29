import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import BlockoutPopup from '../../src/component/CalendarView/BlockoutPopup';

// Mock the dependencies
jest.mock('axios');
jest.mock('@mui/material', () => ({
    Button: ({ children, onClick, ...props }) => (
        <button onClick={onClick} {...props}>{children}</button>
    )
}));

jest.mock('@nextui-org/react', () => ({
    Dropdown: ({ children }) => <div data-testid="dropdown">{children}</div>,
    DropdownTrigger: ({ children }) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenu: ({ children, onSelectionChange }) => (
        <select
            data-testid="dropdown-menu"
            onChange={(e) => onSelectionChange(new Set([e.target.value]))}
        >
            {React.Children.map(children, child => (
                <option value={child.props.key}>{child.props.key}</option>
            ))}
        </select>
    ),
    DropdownItem: ({ children }) => <div>{children}</div>
}));

describe('BlockoutPopup Component', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should open and close the popup', () => {
        const { getByText, queryByText } = render(<BlockoutPopup />);

        // Open popup
        fireEvent.click(getByText('Block Out Dates'));
        expect(queryByText('Create Blockout')).toBeInTheDocument();

        // Close popup
        fireEvent.click(getByText('Close'));
        expect(queryByText('Create Blockout')).not.toBeInTheDocument();
    });

    it('should show validation errors for empty required fields', async () => {
        const { getByText } = render(<BlockoutPopup />);

        // Open popup
        fireEvent.click(getByText('Block Out Dates'));

        // Submit without filling required fields
        fireEvent.click(getByText('Submit'));

        // Check for validation error messages
        expect(getByText('Title is required.')).toBeInTheDocument();
        expect(getByText('Start date is required.')).toBeInTheDocument();
        expect(getByText('End date is required.')).toBeInTheDocument();
    });

    it('should handle successful form submission', async () => {
        axios.post.mockResolvedValueOnce({ status: 200 });
        const { getByText, getByLabelText } = render(<BlockoutPopup />);

        // Open popup
        fireEvent.click(getByText('Block Out Dates'));

        // Fill out the form
        fireEvent.change(getByLabelText('Title:'), { target: { value: 'Test Blockout' } });
        fireEvent.change(getByLabelText('Start Date:'), { target: { value: '2024-10-15' } });
        fireEvent.change(getByLabelText('End Date:'), { target: { value: '2024-10-16' } });

        // Submit form
        fireEvent.click(getByText('Submit'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('http://localhost:5012/manage_blockout', {
                title: 'Test Blockout',
                start_date: '2024-10-15',
                end_date: '2024-10-16',
                timeslot: { anchorKey: 'FULL', currentKey: 'FULL' },
                blockout_description: ''
            });
        });
    });

    it('should handle server error response', async () => {
        // Mock axios to simulate a 409 conflict error
        axios.post.mockRejectedValueOnce({
            response: { status: 409 }
        });

        const { getByText, getByLabelText } = render(<BlockoutPopup />);

        // Open popup
        fireEvent.click(getByText('Block Out Dates'));

        // Fill out the form
        fireEvent.change(getByLabelText('Title:'), { target: { value: 'Test Blockout' } });
        fireEvent.change(getByLabelText('Start Date:'), { target: { value: '2024-10-15' } });
        fireEvent.change(getByLabelText('End Date:'), { target: { value: '2024-10-16' } });

        // Submit form
        fireEvent.click(getByText('Submit'));

        await waitFor(() => {
            expect(screen.getByText(/Failed to create blockout. At least one blockout already exists within the selected date range./i))
                .toBeInTheDocument();
        });
    });

    it('should validate date range', async () => {
        const { getByText, getByLabelText } = render(<BlockoutPopup />);

        // Open popup
        fireEvent.click(getByText('Block Out Dates'));

        // Set invalid date range (end date before start date)
        fireEvent.change(getByLabelText('Start Date:'), { target: { value: '2024-10-16' } });
        fireEvent.change(getByLabelText('End Date:'), { target: { value: '2024-10-15' } });

        // Submit form
        fireEvent.click(getByText('Submit'));

        expect(getByText('End date cannot be earlier than start date.')).toBeInTheDocument();
    });

    it('should handle timeslot selection', async () => {
        const { getByText, getByTestId } = render(<BlockoutPopup />);

        // Open popup
        fireEvent.click(getByText('Block Out Dates'));

        // Change timeslot
        fireEvent.change(getByTestId('dropdown-menu'), { target: { value: 'AM' } });

        expect(getByText('AM')).toBeInTheDocument();
    });
});