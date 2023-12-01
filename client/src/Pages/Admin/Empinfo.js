import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './css/Empinfo.css'
function Empinfo() {
    const [user, setUser] = useState([]);
    const [userImage, setUserImage] = useState(null);

    const [zoomed, setZoomed] = useState(null);
    const [zoomeded, setZoomeded] = useState(null);
    user.sort((a, b) => new Date(b.verifydate) - new Date(a.verifydate));

    useEffect(() => {

        axios.get('/viewuser').then((res) => {
            console.log(res.data);
            setUser(res.data)
        })
    }, [])
    // Function to handle image click
    const handleImageClick = (userId) => {
        // Toggle zoomed state for the clicked image
        if (zoomed === userId) {
            setZoomed(null); // Zoom out
        } else {
            setZoomed(userId); // Zoom in
        }
    };
    // Function to handle image click
    const handleProofClick = (userId) => {
        // Toggle zoomed state for the clicked image
        if (zoomeded === userId) {
            setZoomeded(null); // Zoom out
        } else {
            setZoomeded(userId); // Zoom in
        }
    };
    const deleteUseer = (userId) => {
        axios.delete(`/deleteemp/${userId}`).then((res) => {
            if (res.data) {
                alert('successfully deleted')
                window.location.reload();
            }
        })
    }
    useEffect(() => {
        axios.get('/all-images-proofs').then((res) => {
            console.log(res.data); // Log the entire response data
            if (res.data && Array.isArray(res.data.data)) {
                setUserImage(res.data.data);
            } else {
                console.error('Invalid response data structure:', res.data);
            }
        });
    }, []);
    return (
        <div>
            <section>
                <div className="container">
                    <div className="row mt-5">
                        <div className="col">
                            <Link to="/addevents" className="btn btn-primary ml-auto">
                                Add Event
                            </Link>
                        </div>
                        <div className="col">
                            <Link to="/verifyemp" className="btn btn-info ml-auto">
                                Verify Employees
                            </Link>
                        </div>
                        <div className="col">
                            <Link to="/viewwithdraw" className="btn btn-warning ml-auto">
                                View withdraw
                            </Link>
                        </div>
                        <div className="col">
                            <Link to="/withdraw" className="btn btn-danger ml-auto">
                                Withdraw
                            </Link>
                        </div>
                        <div className="col">
                            <Link to="/sitedetails" className="btn btn-success ml-auto">
                                Site
                            </Link>
                        </div>
                        <div className="col">
                            <Link to="/viewevents" className="btn btn-primary ml-auto">
                                View Events
                            </Link>
                        </div>
                    </div>
                    <table className="table mt-5">
                        <thead>
                            <tr>
                                <th scope="col">No</th>
                                <th scope="col">Name</th>
                                <th scope="col">Place</th>
                                <th scope="col">Address</th>
                                <th scope="col">Age</th>
                                <th scope="col">Height</th>
                                <th scope="col">Number</th>
                                <th scope="col">Xp in Event</th>
                                <th scope="col">Xp in Islamic</th>
                                <th scope="col">Current status</th>
                                <th scope="col">Role</th>
                                <th scope="col">Profile</th>
                                <th scope="col">Proof</th>
                            </tr>
                        </thead>
                        <tbody>
                            {user.map((users, index) => (
                                <tr key={users._id}>
                                    <th scope="row">{index + 1}</th>
                                    <td>{users.name}</td>
                                    <td>{users.place}</td>
                                    <td>{users.adress}</td>
                                    <td>{users.age}</td>
                                    <td>{users.height}</td>
                                    <td>{users.number}</td>
                                    <td>{users.xp}</td>
                                    <td>{users.xpi}</td>
                                    <td>{users.currentStatus}</td>
                                    <td>{users.role}</td>
                                    <td>
                                        {/* Display the profile image */}
                                        {userImage ? (
                                            <img
                                                src={`data:image;base64,${userImage.find((item) => item.userId === users._id && item.image === "profile")?.data}`}
                                                className={`imaged w32 pointer-cursor ${zoomed === users._id ? 'zoom-image zoomed' : ''}`}
                                                onClick={() => handleImageClick(users._id)}
                                                alt={`${users.name}'s Profile`}
                                            />

                                        ) : (
                                            <span>No profile image available</span>
                                        )}

                                        {/* Display the proof image */}
                                        {
                                            Array.isArray(userImage) && userImage.length > 0 ? (
                                                <img
                                                    src={`data:image;base64,${userImage.find((item) => item.userId === users._id && item.image === "proof")?.data}`}
                                                    className={`imaged w32 pointer-cursor ${zoomeded === users._id ? 'zoom-image zoomed' : ''}`}
                                                    onClick={() => handleProofClick(users._id)}
                                                    alt={`${users.name}'s Proof`}
                                                />

                                            ) : (
                                                <span>No proof image available</span>
                                            )
                                        }
                                    </td>
                                    <td>

                                        {users.role !== "admin" && (
                                            <button onClick={() => deleteUseer(users._id)} className="btn btn-danger">
                                                Delete
                                            </button>


                                        )}
                                        &nbsp;&nbsp;
                                        {users.role !== "admin" && (
                                            <Link to={`/editrole/${users._id}`} className="btn btn-primary">
                                                Edit Role
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}

                        </tbody>
                    </table>

                </div>
            </section >
        </div >
    )
}


export default Empinfo;