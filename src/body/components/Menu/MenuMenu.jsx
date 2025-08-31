import CardGridAgenda from "./CardGridAgenda";







import React, { useEffect, useState, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { getAllFromTable } from "../../../redux/actions";

import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO , CAFE_METODOS,CAFE_ESPRESSO, BEBIDAS_FRIAS,BEBIDAS_CALIENTES,PANADERIA_REPOSTERIA_DULCE, PANADERIA_REPOSTERIA_SALADA, ADICIONES_COMIDAS, ADICIONES_BEBIDAS , AGENDA } from "../../../redux/actions-types";

  


















function MenuMenu({ isEnglish }) {
  const infoFija = {
    ES: {
      Intro: `En el Menue`
    },
    EN: {
      Intro: `.with the mission of making this space available to those who can use it as a material and a mediator. Every month we will have language exchanges, workshops, music, art, and culture events, and everything that occurs to us—to you and to us`
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

export default MenuMenu;
