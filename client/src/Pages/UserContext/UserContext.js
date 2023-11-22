import axios from "axios";
import { createContext, useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { useNavigate } from "react-router-dom";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const authToken = localStorage.getItem('token'); // Replace "auibaekjbwea65136awibiba" with actual token
    const [username, setLoggedInUsername] = useState(null);
    const [id, setId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (authToken) {
            // Send the token with the API request
            axios.get('/profile', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            })
                .then((response) => {
                    if (response.data) {
                        setId(response.data.userData.id);
                        setLoggedInUsername(response.data.userData.number);
                    } else {
                        navigate('/login');
                    }
                })
                .catch((error) => {
                    navigate('/login');
                });
        } else {
            navigate('/login');
        }
    }, [authToken]); // Update useEffect when the authToken changes

    return (
        <UserContext.Provider value={{ username, setLoggedInUsername, id, setId }}>
            {children}
        </UserContext.Provider>
    );
}

UserContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
