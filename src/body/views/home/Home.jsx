import React from "react";
import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// import { getAllProjects, postProject } from '../../../redux/actions';
// import Cards from '../../components/cards/Cards.jsx'
function Home() {
    const dispatch = useDispatch();
    
    useEffect( () => {
        // dispatch()
    } , [] );

    const [collection, setCollection] = useState('');
    const [selectedProjects, setSelectedProjects] = useState([]);

    const Projects = useSelector(state => state.allProjects);

    const onPressHandler = (value) => {
        // Handle press action
        setCollection(value)
        setSelectedProjects( dispatch( getAllProjects(value) ) )  
        console.log(Projects);
      };
      
    l

    return (
    <div>

    </div>
    );
}

export default Home;
