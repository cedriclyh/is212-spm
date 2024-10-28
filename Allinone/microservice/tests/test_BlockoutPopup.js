import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import BlockoutPopup from '../src/component/CalendarView/BlockoutPopup';

describe('BlockoutPopup Component', () => {
    it('should open and close the modal', async () => {
        const { getByTestId, queryByTestId } = render(<BlockoutPopup />);
        fireEvent.click(getByTestId('open-modal-button')); // Trigger modal open
        expect(getByTestId('blockout-modal')).toBeTruthy();

        fireEvent.click(getByTestId('close-modal-button')); // Trigger modal close
        await waitFor(() => {
            expect(queryByTestId('blockout-modal')).toBeNull();
        });
    });

    it('should validate form inputs', async () => {
        const { getByTestId, getByText } = render(<BlockoutPopup />);
        fireEvent.click(getByTestId('open-modal-button'));

        // Attempt to submit form with empty inputs
        fireEvent.click(getByTestId('submit-button'));
        await waitFor(() => {
            expect(getByText('Please fill out this field.')).toBeTruthy();
        });

        // Fill the form with valid data
        fireEvent.change(getByTestId('date-input'), { target: { value: '2024-10-15' } });
        fireEvent.change(getByTestId('timeslot-select'), { target: { value: 'AM' } });
        fireEvent.change(getByTestId('reason-input'), { target: { value: 'Maintenance' } });

        // Try submitting again
        fireEvent.click(getByTestId('submit-button'));
        await waitFor(() => {
            expect(getByText('Blockout request submitted successfully')).toBeInTheDocument();
        });
    });

    it('should handle submission data correctly', async () => {
        const onSubmitMock = jest.fn();
        const { getByTestId } = render(<BlockoutPopup onSubmit={onSubmitMock} />);
        fireEvent.click(getByTestId('open-modal-button'));

        // Fill the form with valid data and submit
        fireEvent.change(getByTestId('date-input'), { target: { value: '2024-10-15' } });
        fireEvent.change(getByTestId('timeslot-select'), { target: { value: 'AM' } });
        fireEvent.change(getByTestId('reason-input'), { target: { value: 'Maintenance' } });
        fireEvent.click(getByTestId('submit-button'));

        await waitFor(() => {
            expect(onSubmitMock).toHaveBeenCalledWith({
                date: '2024-10-15',
                timeslot: 'AM',
                reason: 'Maintenance'
            });
        });
    });

    it('should display error messages on server error', async () => {
        const { getByTestId, getByText } = render(<BlockoutPopup />);
        fireEvent.click(getByTestId('open-modal-button'));

        // Simulate server error
        jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                status: 500,
                json: () => Promise.resolve({ message: 'Internal Server Error' })
            })
        );

        // Fill the form and submit
        fireEvent.change(getByTestId('date-input'), { target: { value: '2024-10-15' } });
        fireEvent.change(getByTestId('timeslot-select'), { target: { value: 'AM' } });
        fireEvent.change(getByTestId('reason-input'), { target: { value: 'Maintenance' } });
        fireEvent.click(getByTestId('submit-button'));

        await waitFor(() => {
            expect(getByText('Internal Server Error')).toBeInTheDocument();
        });
    });

    it('should ensure only available timeslots can be selected', async () => {
        const { getByTestId, getByText } = render(<BlockoutPopup availableTimeslots={['AM', 'PM']} />);
        fireEvent.click(getByTestId('open-modal-button'));

        const timeslotSelect = getByTestId('timeslot-select');
        const availableOptions = Array.from(timeslotSelect.options).map(opt => opt.value);
        expect(availableOptions).toEqual(expect.arrayContaining(['AM', 'PM']));
    });
});
