import React from 'react';
import {db} from '../firebaseApp';
import {getDoc, getDocs, query, where, collection, onSnapshot, writeBatch, doc, updateDoc} from "firebase/firestore";
import { useState, useEffect } from 'react';

function findHopDiffs(originalHopData, reportedIssueHopData){

    let hopDiffs = [null, null, null, null, null, null, null];

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
                }
            } else {

                if(oHop.etRangeStr == "closed"){
                    hopDiffs[i] = {"orig": "Closed", "new": "N/A"};
                } else {
                    hopDiffs[i] = {"orig": oHop.etRangeStr, "new": "Closed"};
                }
            }
        } else {

            if(eHop != null){
                hopDiffs[i] = {"orig": "Closed", "new": eHop.etRangeStr};
            } else {
                hopDiffs[i] = {"orig": "Closed", "new": "N/A"};
            }
        }
    }

    return hopDiffs;

}

export default function DiffView({setShowingDiffView, diffLandmark}) {

    const [fullLandmarkData, setFullLandmarkData] = useState(null);

    const handleBack = () => {
        setShowingDiffView(false);
    }


    useEffect(() => {
        
        async function getBathroomData(){

            if(diffLandmark != null){
                try {

                    const bathroomDocRef = doc(db, "landmark_locations_data", diffLandmark.landmark_id);
    
                    const docSnap = await getDoc(bathroomDocRef);
    
                    if (docSnap.exists()) {
    
                        console.log("full doc data retrieved");
                        
                        const fullData = {...diffLandmark, ...docSnap.data()};
                        const hopDiffs = findHopDiffs(fullData.hopData.flattenedHopDataForFilteringAndMutating, fullData.edited_hop_data.flattenedHopDataForFilteringAndMutating);

                        setFullLandmarkData({...fullData, "hopDiffs": hopDiffs});
    
                    } else {
                        console.log("Bathroom document not found!!!");
                    }
    
                } catch(error){
                    console.log("Error getting bathroom data: ", error);
                }

            } else {
                console.log("diffLandmark is null");
            }

        }

        getBathroomData();
        

    }, [diffLandmark]);

    // return (
    //     <div>
    //         <button className="btn btn-link" onClick={handleBack}>Back</button>

    //         <div className="card container">
    //             <div className="row">
    //                 <div className="col-sm">
    //                     <div>
    //                         {/* Bathroom Building Name Diff: */}
    //                     </div>
                        
    //                 </div>
    //                 <div className="col-sm">
    //                     <div>

    //                     </div>
    //                 One of three columns
    //                 </div>
    //                 <div className="col-sm">
    //                 One of three columns
    //                 </div>
    //             </div>
    //         </div>
    //     </div>
    // );

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return (
        <>
            {fullLandmarkData != null ?
            <div>
                <button className="btn btn-link" onClick={handleBack}>Back</button>

                <div className="container">
                    <div className="row">

                        <div className="col">
                            <div className="px-3 mb-3 mt-3">
                                <h5>Building Name Diff</h5>
                            </div>

                            <div className="container pt-0">
                                <div className="row">
                                    <div className="col-12">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Original</th>
                                                    <th scope="col">Proposed Update</th>
                                                </tr>
                                                </thead>
                                            <tbody>
                                                    <tr>
                                                        <td>{fullLandmarkData.building}</td>
                                                        <td>{fullLandmarkData.edited_bathroom_name || "N/A"}</td>
                                                    </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        

                        {/* <div className="col"> */}
                            <div className="px-3 mb-3">
                                <h5>Location Diff</h5>
                            </div>
                            
                            <div className="container pt-0">
                                <div className="row">
                                    <div className="col-12">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th scope="col"></th>
                                                    <th scope="col">Original</th>
                                                    <th scope="col">Proposed Update</th>
                                                </tr>
                                                </thead>
                                            <tbody>
                                                    <tr>
                                                        <th className="">Longitude</th>
                                                        <td>{fullLandmarkData.longitude}</td>
                                                        <td>{fullLandmarkData.edited_location_data ? fullLandmarkData.edited_location_data.longitude : "N/A" }</td>
                                                    </tr>
                                                    <tr>
                                                        <th className="">Latitude</th>
                                                        <td>{fullLandmarkData.latitude}</td>
                                                        <td>{fullLandmarkData.edited_location_data ? fullLandmarkData.edited_location_data.latitude : "N/A" }</td>
                                                    </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col">
                            <div className="px-3 mb-3">
                                <h5>Hours of Operation Diff</h5>
                            </div>
                            
                            <div className="container pt-0">
                                <div className="row">
                                    <div className="col-12">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th scope="col"></th>
                                                    <th scope="col">Original</th>
                                                    <th scope="col">Proposed Update</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fullLandmarkData.hopDiffs && fullLandmarkData.hopDiffs.map((hopDiff, index) => (
                                                    <tr key={index}>
                                                        <th className="">{daysOfWeek[index]}</th>
                                                        <td>{hopDiff.orig}</td>
                                                        <td>{hopDiff.new}</td>
                                                        {/* <td>{fullLandmarkData.hopData.flattenedHopDataForFilteringAndMutating[dayInd] != null ? fullLandmarkData.hopData.flattenedHopDataForFilteringAndMutating[dayInd].etRangeStr : "Closed" }</td>
                                                        <td>{fullLandmarkData.edited_hop_data.flattenedHopDataForFilteringAndMutating[dayInd] != null ? fullLandmarkData.edited_hop_data.flattenedHopDataForFilteringAndMutating[dayInd].etRangeStr : "Closed"}</td> */}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> : 
                
            <div>Loading...</div>
            }
        </>
        
    )
}
