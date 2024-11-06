import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Chip,
    User,
    Spinner,
} from "@nextui-org/react";
import profilePic from "../Icons/profile_pic.png";
import { formatTimeslot } from "../RequestPage/RequestPageUtils";

const statusColorMap = {
    Approved: "success",
    Rejected: "danger",
    Pending: "warning",
    Cancelled: "default",
    Withdrawn: "secondary",
};

export default function ViewRequest() {
    const { uid } = useParams();
    const [requestData, setRequestData] = useState(null);
    const [dates, setDates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [arrangements, setArrangements] = useState([]);

    const handleWithdrawArrangement = async (arrangementId) => {
        if (!window.confirm("Are you sure you want to withdraw this arrangement?")) {
            return;
        }
        
        const reason = prompt("Please enter a reason for withdrawal:");
        
        if (!reason) {
            alert("Withdrawal reason is required.");
            return;
        }
        
        const arrangement = arrangements.find(a => a.arrangement_id === arrangementId);
        if (!arrangement) {
            alert("Arrangement not found.");
            return;
        }

        const currentDate = new Date();
        const arrangementDate = new Date(arrangement.arrangement_date);
        const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;

        if (Math.abs(arrangementDate - currentDate) > twoWeeksInMs) {
            alert("You can only withdraw arrangements within two weeks of the arrangement date.");
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:5005/withdraw_arrangement/${uid}/${arrangementId}`, {
                method: 'DELETE',
            });
    
            if (response.ok) {
                setArrangements(arrangements.filter(a => a.arrangement_id !== arrangementId));
                setRequestData(prevData => ({
                    ...prevData,
                    status: "Withdrawn",
                }));
                // Make a call to update the status in the database
                const statusResponse = await fetch(`http://localhost:5003/update_request/${uid}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: "Withdrawn" }),
                });

                if (!statusResponse.ok) {
                    console.error('Error updating request status:', statusResponse.status);
                }
            } else {
                console.error('Error deleting arrangement:', response.status);
            }
        } catch (error) {
            console.error('Error deleting arrangement:', error);
        }
    };
    
    useEffect(() => {
        const fetchRequestData = async () => {
            try {
                const response = await fetch(`http://localhost:5011/view_request/${uid}`);
                if (response.ok) {
                    const data = await response.json();
                    setRequestData(data.data);
                    
                    if (data.data.is_recurring) {
                        setDates(data.data.arrangement_dates || []);
                    } else {
                        setDates(data.data.arrangement_date ? [data.data.arrangement_date] : []);
                    }
                } else {
                    console.error("Failed to fetch request data");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequestData();
    }, [uid]);

    useEffect(() => {
        async function fetchArrangementDates() {
            try {
                const response = await fetch(
                    `http://localhost:5005/get_arrangements/request/${uid}`
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const output = await response.json();
                setArrangements(output.data);
            } catch (error) {
                console.error("Error fetching arrangement dates:", error);
                setArrangements([]);
            }
        }
    
        if (requestData?.status === "Approved") {
            fetchArrangementDates();
        }
    }, [requestData?.status, uid]);

    
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                textAlign: 'center'
            }}>
                <Spinner />
            </div>
        );
    }

    if (!requestData) {
        return <div>No request data found</div>;
    }

    return (
        <div className="space-y-6 bg-white border border-gray-300 shadow-lg p-6" style={{ padding: "10px 20px", borderRadius: "10px" }}>
            <div className="my-2">
                <h2 className="text-lg font-semibold text-gray-900">Request {uid}</h2>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p style={{ marginBottom: "10px" }}>Reviewer:</p>
                <User
                    className="my-2"
                    avatarProps={{ radius: "lg", src: profilePic }}
                    description={requestData.manager_details.email}
                    name={`${requestData.manager_details.staff_fname} ${requestData.manager_details.staff_lname}`}
                >
                    {requestData.manager_details.email}
                </User>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p style={{ marginBottom: "10px" }}>Requestee:</p>
                <User
                    className="my-2"
                    avatarProps={{ radius: "lg", src: profilePic }}
                    description={requestData.staff_details.email}
                    name={`${requestData.staff_details.staff_fname} ${requestData.staff_details.staff_lname}`}
                >
                    {requestData.staff_details.email}
                </User>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p>Requested On:</p>
                <p className="text-bold text-small capitalize">{requestData.request_date}</p>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p style={{ marginBottom: "10px" }}>Status:</p>
                <Chip color={statusColorMap[requestData.status]} size="sm" variant="flat">
                    {requestData.status}
                </Chip>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p>Timeslot:</p>
                <div>
                    <div>
                        <p className="text-bold text-small capitalize">
                            {formatTimeslot(requestData.timeslot)[0]}, {formatTimeslot(requestData.timeslot)[1]}
                        </p>
                    </div>
                </div>
            </div>

            {requestData.is_recurring && (
                <div style={{ marginTop: "20px" }}>
                    <p style={{ marginBottom: "10px" }}>Recurring Weekday:</p>
                    <div>
                        <p className="text-bold text-small capitalize">
                            {requestData.recurring_day || "N/A"}
                        </p>
                    </div>
                </div>
            )}

            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                {requestData.status === "Approved" && (
                    <Table aria-label="Arrangement dates table" isCompact>
                        <TableHeader>
                            <TableColumn>ARRANGEMENT DATES (YYYY-MM-DD)</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {dates.map((date, index) => {
                                // Find if the date is an arrangement date
                                const arrangement = arrangements.find(arr => arr.arrangement_date === date);

                                return (
                                    <TableRow key={index}>
                                        <TableCell>{date}</TableCell>
                                        {arrangement ? (
                                            <TableCell>
                                                <Chip color="success" size="sm" variant="flat">Approved</Chip>
                                            </TableCell>
                                        ) : (
                                            <TableCell>
                                                <Chip color="default" size="sm" variant="flat">Cancelled</Chip>
                                            </TableCell>
                                        )}
                                        {arrangement ? (
                                            <TableCell>
                                                <Button color="danger" size="sm" variant="flat" 
                                                    onClick={() => handleWithdrawArrangement(arrangement.arrangement_id)}
                                                >
                                                    Withdraw
                                                </Button>
                                            </TableCell>
                                        ) : (
                                            <TableCell>-</TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
                {requestData.status !== "Approved" && (
                    <Table aria-label="Arrangement dates table" isCompact>
                        <TableHeader>
                            <TableColumn>ARRANGEMENT DATES (YYYY-MM-DD)</TableColumn>
                            
                        </TableHeader>
                        <TableBody>
                            {dates.map((arrangement, index) => (
                                <TableRow key={index}>
                                    <TableCell>{arrangement}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}