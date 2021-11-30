import React from 'react';
import {db} from '../firebaseApp';
import {getDocs, query, where, collection, onSnapshot, writeBatch, doc, updateDoc} from "firebase/firestore";
import { useState, useEffect } from 'react';
import DiffView from './DiffView';
import cloneDeep from 'lodash/cloneDeep';


function findHopDiffs(originalHopData, reportedIssueHopData){

    let hopDiffs = [null, null, null, null, null, null, null];

    let areThereDiffs = false;

    for(let i=0; i<7; i++){

        const oHop = originalHopData[i];
        const eHop = reportedIssueHopData[i];



        if(oHop != null){

            if(eHop != null){

                if(eHop.etRangeStr == oHop.etRangeStr){
                    hopDiffs[i] = {"orig": oHop.etRangeStr, "new": "N/A"};
                }
                else {
                    hopDiffs[i] = {"orig": oHop.etRangeStr, "new": eHop.etRangeStr};
                    areThereDiffs = true;
                }
            } else {

                if(oHop.etRangeStr == "closed"){
                    hopDiffs[i] = {"orig": "Closed", "new": "N/A"};
                } else {
                    hopDiffs[i] = {"orig": oHop.etRangeStr, "new": "Closed"};
                    areThereDiffs = true;
                }
            }
        } else {

            if(eHop != null){
                hopDiffs[i] = {"orig": "Closed", "new": eHop.etRangeStr};
                areThereDiffs = true;
            } else {
                hopDiffs[i] = {"orig": "Closed", "new": "N/A"};
            }
        }
    }

    return {areThereDiffs: areThereDiffs, hopDiffs: hopDiffs};

}

export default function ReportedIssuesView() {

    const [reportedIssues, setReportedIssues] = useState(null);
    const [fullIssueData, setFullIssueData] = useState(null);
    const [showingDiffView, setShowingDiffView] = useState(false);
    const [diffLandmark, setDiffLandmark] = useState(null); 

    useEffect(() => {

        const reportedIssuesRef = collection(db, "landmark_reported_issues");

        const q = query(reportedIssuesRef, where("status", "==", "pending"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {

            const repIssues = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();

                repIssues.push({
                    reportIssueDocId: doc.id,
                    bathroomName: data.building + " (" + data.gender + ", floor " + data.floor + ")",
                    wasBuildingEdited: data.edited_bathroom_name != null,
                    wasHoursEdited: data.edited_hop_data != null,
                    wasLocationEdited: data.edited_location_data != null,
                    ...data
                });
                
            });

            // const repIssuesFormatted = repIssues.map(rep => {

            //     return {
            //         bathroomName: rep.building + " (" + rep.gender + ", floor " + rep.floor + ")",
            //         wasBuildingEdited: rep.edited_bathroom_name != null,
            //         wasHoursEdited: rep.edited_hop_data != null,
            //         wasLocationEdited: rep.edited_location_data != null,
            //         ...rep
            //     };
            // });

            console.log("set reported issues");
            setReportedIssues(repIssues);
        });

        return unsubscribe;
        
    }, []);



    useEffect(() => {
        
        async function getLandmarkDocs(){

            if(reportedIssues != null && reportedIssues.length > 0){

                try {
                    const landmarkIds = reportedIssues.map(issue => issue.landmark_id);


                    if(landmarkIds == null || landmarkIds.length < 1){
                        console.log("Unexpected error. Landmark ids is null or empty");
                        return;
                    }

                    const landmarksRef = collection(db, "landmark_locations_data");
            
                    const q = query(landmarksRef, where("id", "in", landmarkIds));
            
                    const querySnapshot = await getDocs(q);
    
                    let fullIssues = cloneDeep(reportedIssues);

                    let landmarkMap = new Map();

                    querySnapshot.forEach((doc) => {
                            landmarkMap.set(doc.id, doc.data());
                        }
                    );

                    fullIssues = fullIssues.map(partialIssue => {
                        return {
                            ...landmarkMap.get(partialIssue.landmark_id),
                            ...partialIssue
                        };
                    });

                    fullIssues = fullIssues.map(issue => {

                        const {areThereDiffs, hopDiffs} = findHopDiffs(issue.hopData.flattenedHopDataForFilteringAndMutating, issue.edited_hop_data.flattenedHopDataForFilteringAndMutating)

                        return {
                            ...issue,
                            hopDiffs: hopDiffs,
                            wasHoursEdited: areThereDiffs
                        };
                    });

                    console.log("setting full issue data");
                    setFullIssueData(fullIssues);
                    
                } catch(error){
                    console.log(error);
                }
            }
        }

        getLandmarkDocs();
        
        
    }, [reportedIssues]);

    const handleAccept = async (reportedIssue) => {

        if (window.confirm("Are you sure you want to ACCEPT these changes.")) {
           
            try {
                const batch = writeBatch(db);

                const landmarkDataDocRef = doc(db, "landmark_locations_data", reportedIssue.landmark_id);

                let updates = {};

                if(reportedIssue.wasBuildingEdited){
                    console.log("building edits");
                    updates["building"] = reportedIssue.edited_bathroom_name
                }

                // if(reportedIssue.wasHoursEdited){
                //     updates["hopData"] = reportedIssue.edited_hop_data;
                // }

                if(reportedIssue.wasLocationEdited){
                    console.log("adding location edits");
                    updates["latitude"] = edited_location_data.latitude;
                    updates["longitude"] = edited_location_data.longitude;
                }

                if(Object.keys(updates).length > 0){
                    console.log("adding landmark update to batch");
                    batch.update(landmarkDataDocRef, updates);

                    const reportIssueDocRef = doc(db, "landmark_reported_issues", reportedIssue.reportIssueDocId);

                    batch.update(reportIssueDocRef, {"status": "accepted"});
                }

                await batch.commit();
                
            } catch (error){
                console.log("Error accepting changes: ", error);
            }
        } else {
            console.log("Cancel accept button pressed");
        }
    }

    const handleReject = async (reportedIssue) => {

        if (window.confirm("Are you sure you want to REJECT these changes?")) {

            try {
                const reportIssueDocRef = doc(db, "landmark_reported_issues", reportedIssue.reportIssueDocId);

                await updateDoc(reportIssueDocRef, {"status": "rejected"});

            } catch (error){
                console.log("Error rejecting changes: ", error);
            }
        } else {
            console.log("Reject changes cancel button pressed");
        }
    }

    const showDiff = (reportedIssue) => {
        setDiffLandmark(reportedIssue);
        setShowingDiffView(true);
    }

    const dummyData = [
        {
            landmark_id: 1,
            bathroomName: "Knights Plaza Dominos (Male, floor 1)", 
            wasBuildingEdited: true,
            wasHoursEdited: false,
            wasLocationEdited: true
        },
        {
            landmark_id: 2,
            bathroomName: "Classroom Building 2 (Female, floor 3)", 
            wasBuildingEdited: true,
            wasHoursEdited: true,
            wasLocationEdited: false
        }
    ]


    return (

        <>
        {!showingDiffView ? 
            <div>
                <div className="container">
                <div className="row">
                    <div className="col-12">
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th scope="col">Bathroom Name</th>
                                    <th scope="col">Building Name Edited</th>
                                    <th scope="col">Hours Edited</th>
                                    <th scope="col">Location Edited</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>

                                {fullIssueData && fullIssueData.length > 0 ? fullIssueData.map(reportedIssue => (
                                    <tr key={reportedIssue.landmark_id}>
                                        {/* <th scope="row">1</th> */}
                                        <td>{reportedIssue.bathroomName}</td>
                                        <td className={reportedIssue.wasBuildingEdited ? "yes-td" : "no-td"}>{reportedIssue.wasBuildingEdited ? "Yes" : "No"}</td>
                                        <td className={reportedIssue.wasHoursEdited ? "yes-td" : "no-td"}>{reportedIssue.wasHoursEdited ? "Yes" : "No"}</td>
                                        <td className={reportedIssue.wasLocationEdited ? "yes-td" : "no-td"}>{reportedIssue.wasLocationEdited ? "Yes" : "No"}</td>
                                        <td>
                                            <button type="button" className="btn btn-link action-btn-accept" onClick={() => handleAccept(reportedIssue)}><i className="bi bi-check-lg"></i></button>
                                            <button type="button" className="btn btn-link action-btn-reject" onClick={() => handleReject(reportedIssue)}><i className="bi bi-x-lg"></i></button>
                                            <button type="button" className="btn btn-link action-btn-diff" onClick={() => showDiff(reportedIssue)}><i className="bi bi-file-diff"></i></button>
                                        </td>
                                    </tr>
                                )) : 
                                    <tr>
                                        <td colSpan="5"><div className="text-center">No reported issues found.</div></td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
            </div> : <DiffView setShowingDiffView={setShowingDiffView} diffLandmark={diffLandmark} />
        }
        </>
        
    )
}
