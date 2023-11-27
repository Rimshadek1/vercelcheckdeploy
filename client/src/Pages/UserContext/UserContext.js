import axios from "axios";
import { createContext, useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { useNavigate } from "react-router-dom";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const authToken = "auibaekjbwea65136awibiba";
    const [username, setLoggedInUsername] = useState(null);
    const [id, setId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/profile', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            withCredentials: true,
        }).then(response => {
            if (response.data) {
                setId(response.data.userData.id);
                setLoggedInUsername(response.data.userData.username); // Fix the variable name here
            } else {
                navigate('/login');
            }
        }).catch(error => {
            navigate('/login');
        });
    }, []);

    return (
        <UserContext.Provider value={{ username, setLoggedInUsername, id, setId }}>
            {children}
        </UserContext.Provider>
    );
}

UserContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
