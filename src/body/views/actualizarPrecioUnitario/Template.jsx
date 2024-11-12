import React                            from "react"
import { useEffect , useState }         from "react"
import { Link }                         from 'react-router-dom'
import { useDispatch, useSelector }     from 'react-redux';
import { getAllProjects, postProject }  from '../../../redux/actions'

function Home(){
    const dispatch = useDispatch()
    
    useEffect( () => {
        dispatch( getAllProjects() )
    } , [] );

    const [ sampleState , setSampleState ] = useState()

    const sambleSelectionState = useSelector(state => state.allLocations)

    const sampleHandler = (e) => {

        dispatch()

    }
    return(
        <div> Sample Body </div>
    )


}

export default Home;