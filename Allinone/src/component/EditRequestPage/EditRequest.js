import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NewRequest from '../NewRequestPage/NewRequest';
import { Spinner } from "@nextui-org/react";

const EditRequestPage = () => {
  const { uid } = useParams();
  const [requestData, setRequestData] = useState(null);
  
  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const response = await fetch(`http://54.84.53.208:5003/get_request/${uid}`);
        if (response.ok) {
          const data = await response.json();
          setRequestData(data.data);
        } else {
          console.error("Failed to fetch request data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchRequestData();
  }, [uid]);

  return requestData ? (
    <NewRequest initialFormData={requestData} />
  ) : (
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
};

export default EditRequestPage;