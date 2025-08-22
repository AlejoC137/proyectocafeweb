import React, { useEffect, useState } from 'react';
import Card from '../card/Card';
import styles from '../cards/Cards.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { getAllProyectistas, agregarPropina } from '../../../redux/actions'; // Importa la acción agregarPropina
import Propinas from './Propinas';

function Proyectistas() {
    const [crew, setCrew ] = useState([]);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchData = async () => {
            const currentCrew = await getAllProyectistas();
            console.log(currentCrew);
            setCrew(currentCrew);
        };

        fetchData();
    }, []);

    const handleHoraSalida = () => {
        const timestamp = new Date().toISOString();
        // Aquí puedes enviar el timestamp a donde necesites
        console.log('Hora de Salida:', timestamp);
    };

    const handleHoraAcceso = () => {
        const timestamp = new Date().toISOString();
        // Aquí puedes enviar el timestamp a donde necesites
        console.log('Hora de Acceso:', timestamp);
    };

    const handleAgregarPropina = (id) => {
        const propinaInput = document.getElementById("propinaInput");
        const valor = propinaInput.value.trim();

        if (valor) {
            const timestamp = new Date().toISOString();
            dispatch(agregarPropina(id, timestamp, valor));
            propinaInput.value = ''; // Limpiar el input después de agregar la propina
        } else {
            console.log('Ingrese un valor válido para la propina.');
        }
    };



    return (
        <div>
            <div className={styles.cards}>
                {crew.map((PAD) => (
                    <div key={PAD._id}>
                        <Card
                            fondo={PAD.foto}
                            name={PAD?.Nombre}
                            precio={PAD?.Bio}
                        />

                        <div>
                            <button style={{ backgroundColor: 'red' }} onClick={handleHoraSalida}>Hora de Salida</button>
                            <button style={{ backgroundColor: 'green' }} onClick={handleHoraAcceso}>Hora de Acceso</button>
                        </div>
                    </div>
                ))}
                        <Propinas></Propinas>
            </div>
        </div>
    );
}

export default Proyectistas;
