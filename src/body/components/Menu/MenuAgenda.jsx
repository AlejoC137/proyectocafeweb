import CardGridAgenda from "./CardGridAgenda";







import React, { useEffect, useState, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { getAllFromTable } from "../../../redux/actions";

import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO , CAFE_METODOS,CAFE_ESPRESSO, BEBIDAS_FRIAS,BEBIDAS_CALIENTES,PANADERIA_REPOSTERIA_DULCE, PANADERIA_REPOSTERIA_SALADA, ADICIONES_COMIDAS, ADICIONES_BEBIDAS , AGENDA } from "../../../redux/actions-types";

  


















function MenuAgenda({ isEnglish }) {
  const infoFija = {
    ES: {
      Intro: `no por solo gusto sino necesidad la de disponer este espacio a aquiellos que lo puedan usar , como material y mediador, todos los meses haremos intercambio de idiomas , haremos talleres , eventos de musica , arte y cultura, y todo lo que se nos ocurra. a uds y a nosotros.`
    },
    EN: {
      Intro: `not just for pleasure but out of necessity to make this space available to those who can use it, as material and mediator, every month we will hold language exchanges, workshops, music, art and culture events, and everything we can think of. for you and for us.`
    }
  };

  const text = isEnglish ? infoFija.EN.Intro : infoFija.ES.Intro;

const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // await Promise.all([dispatch(getAllFromTable(AGENDA))]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, [dispatch]);


  const allAgenda = useSelector((state) => state.allAgenda);

  return (
    <div className="text-md font-SpaceGrotesk whitespace-pre-line" style={{ fontSize: '18px' }}>
      <div className="text-center mb-4">
        <h1 className="text-3xl font-LilitaOne font-bold leading-tight">
          {isEnglish ? "This Month on Proyecto Café" : "Este Mes en Proyecto Café"}
        </h1>
      </div>
      <p className="text-justify mb-4">{text}</p>
      <CardGridAgenda data={allAgenda} isEnglish={isEnglish} />
    </div>
  );
}

export default MenuAgenda;
