import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, resetExpandedGroups, toggleShowEdit } from "../../../redux/actions";
import {WORKISUE, Staff, WorkIsue, Procedimientos, STAFF, MENU, ITEMS, PRODUCCION, PROVEE, PROCEDE, MenuItems } from "../../../redux/actions-types";
import AccionesRapidasActividades from "../actualizarPrecioUnitario/AccionesRapidasActividades";
import { CardGridWorkIsue } from "./gridInstance/CardGridWorkIsue";
import { CardGridStaff } from "./gridInstance/CardGridStaff";
import { CardGridProcedimientos } from "./gridInstance/CardGridProcedimientos";
import { CardGridInventarioMenu } from "@/components/ui/cardGridInventarioMenu";
import { CardGridInventarioMenuLunch } from "@/components/ui/CardGridInventarioMenuLunch";

function Manager() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(Staff);
  const [showAccionesRapidasActividades, setShowAccionesRapidasActividades] = useState(false);

  const AllProcedimientos = useSelector((state) => state.AllProcedimientos || []);
  const AllStaff = useSelector((state) => state.AllStaff || []);
  const AllWorkIsue = useSelector((state) => state.AllWorkIsue || []);
  const recetas = useSelector((state) => state.allRecetasMenu || []);
  const showEdit = useSelector((state) => state.showEdit);
  const Menu = useSelector((state) => state.allMenu || []);

  const filteredItems = {
    [Staff]: AllStaff,
    [WorkIsue]: AllWorkIsue,
    [Procedimientos]: AllProcedimientos,
    [MenuItems]: Menu,
    
  }[currentType] || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(PROVEE)),
          dispatch(getAllFromTable(WORKISUE)),
          dispatch(getAllFromTable(STAFF)),
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable(PROCEDE)),

        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleToggleType = (type) => {
    if (currentType === type) {
      dispatch(resetExpandedGroups());
    } else {
      setCurrentType(type);
    }
  };

  const handleToggleShowEdit = () => {
    dispatch(toggleShowEdit());
  };

  const handleToggleAccionesRapidasActividades = () => {
    setShowAccionesRapidasActividades((prev) => !prev);
  };

  if (loading) {
    return <div className="text-center mt-10">Cargando...</div>;
  }

  return (
    <div className="flex flex-col w-screen h-screen">
      <div className="flex justify-center align-top gap-4 p-4 fixed top-12 left-0 right-0 bg-white z-10">
        {[



          { type: MenuItems, label: "Menú", icon: "🗺️" },
          { type: Procedimientos, label: "Procedimientos", icon: "📝" },
          { type: Staff, label: "Staff", icon: "👩‍🚀" },
          { type: WorkIsue, label: "WorkIssues", icon: "🧹" },
        ].map(({ type, label, icon }) => (
          <button
            key={type}
            className={`rounded-md w-1/5 font-bold flex flex-col items-center justify-center ${
              currentType === type ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
            onClick={() => handleToggleType(type)}
          >
            {icon}
            <span className="text-xs mt-1 truncate">{label}</span>
          </button>
        ))}
        <button
          className={`w-1/5 px-2 rounded-md flex flex-col items-center justify-center ${
            showEdit ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          onClick={handleToggleShowEdit}
        >
          ⚙️
          <span className="text-xs mt-1 truncate">Edición</span>
        </button>
        <button
          className={`w-1/5 px-2 rounded-md flex flex-col items-center justify-center ${
            showAccionesRapidasActividades ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          onClick={handleToggleAccionesRapidasActividades}
        >
          ⚡
          <span className="text-xs mt-1 truncate">Acciones</span>
        </button>
      </div>
      <br></br>
      <div className="flex flex-col mt-20 overflow-y-auto">
        {showAccionesRapidasActividades && <AccionesRapidasActividades currentType={currentType} />}
        <h3 className="text-lg font-bold ml-4">{`Listado de ${currentType}`}</h3>
        {
          (() => {
            switch (currentType) {
              case WorkIsue:
                return <CardGridWorkIsue currentType={currentType} />;
              case Staff:
                return <CardGridStaff currentType={currentType} />;
              case MenuItems:
                return (
                  <CardGridInventarioMenuLunch
                    products={filteredItems}
                    showEdit={showEdit}
                  />
                );
              case Procedimientos:
              default:
                return <CardGridProcedimientos currentType={currentType} />;
            }
          })()
        }
      </div>
    </div>
  );
}

export default Manager;
