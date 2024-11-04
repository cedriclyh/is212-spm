import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Chip,
    User,
    Pagination,
    Spinner,
} from "@nextui-org/react";
import profilePic from "../Icons/profile_pic.png"
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
    console.log(uid);

    useEffect (() => {
        const fetchRequestData = async () => {
            try {
              const response = await fetch(`http://localhost:5011/view_request/${uid}`);
              console.log(response);
              if (response.ok) {
                const data = await response.json();
                setRequestData(data.data);
                console.log(data.data)
              } else {
                console.error("Failed to fetch request data");
              }
            } catch (error) {
              console.error("Error fetching data:", error);
            }
          };

        fetchRequestData();
    }, [uid]);

    console.log(requestData);

    return requestData ? (
        <>
          <div className="space-y-6 bg-white border border-gray-300 shadow-lg p-6" style={{ padding: "10px 20px", borderRadius: "10px" }}>
            <div className="my-2">
              <h2 className="text-lg font-semibold text-gray-900">Request {uid}</h2>
            </div>
      
            <div style={{ marginTop:"20px" }}>
                <p style={{ marginBottom:"10px" }}>Reviewer:</p>
                <User
                    className="my-2"
                    avatarProps={{ radius: "lg", src: profilePic }}
                    description={requestData.manager_details.email}
                    name={`${requestData.manager_details.staff_fname} ${requestData.manager_details.staff_lname}`}
                >
                    {requestData.manager_details.email}
                </User>
            </div>

            <div style={{ marginTop:"20px" }}>
                <p style={{ marginBottom:"10px" }}>Requestee:</p>
                <User
                    className="my-2"
                    avatarProps={{ radius: "lg", src: profilePic }}
                    description={requestData.staff_details.email}
                    name={`${requestData.staff_details.staff_fname} ${requestData.staff_details.staff_lname}`}
                >
                    {requestData.staff_details.email}
                </User>
            </div>

            <div style={{ marginTop:"20px" }}>
                <p>Requested On:</p>
                <p>{requestData.request_date}</p>
            </div>

            <div style={{ marginTop:"20px"}}>
                <p style={{ marginBottom:"10px" }}>Status:</p>
                <Chip color={statusColorMap[requestData.status]} size="sm" variant="flat">
                    {requestData.status}
                </Chip>
            </div>

            <div style={{ marginTop:"20px"}}>
                <p>Timeslot:</p>
                <div>
                   <div>
                        <p className="text-bold text-small capitalize">{formatTimeslot(requestData.timeslot)[0]}</p>
                        <p className="text-bold text-tiny capitalize text-default-400">{formatTimeslot(requestData.timeslot)[1]}</p>
                    </div>                    
                </div>
            </div>

            <div>
                
            </div>
            
          </div>
        </>
      ) : (
        <p>Loading...</p>
      );
};