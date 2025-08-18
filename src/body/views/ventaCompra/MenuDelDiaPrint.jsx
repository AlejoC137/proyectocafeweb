import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, AGENDA  } from "../../../redux/actions-types";
import { CardGridPrint } from "@/components/ui/cardGridPrint";
import { Button } from "@/components/ui/button";

function MenuDelDiaPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const printRef = useRef(null);
  const menuData = useSelector((state) => state.allMenu);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(AGENDA))
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handlePrint = () => {
    // This function prepares the content for printing
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (loading) {
    return <div className="text-center text-white text-2xl font-SpaceGrotesk font-light">Cargando menú...</div>;
  }

  return (
    <div className="flex w-screen flex-col items-center justify-center " ref={printRef}>
      {/* Buttons are hidden when printing */}
      <div className="flex gap-4 mt-12 mb-5 print:hidden">
        <Button onClick={handlePrint} className="font-SpaceGrotesk font-medium">
          🖨️
        </Button>
      </div>


      <div className="flex justify-center ">
        <div id="print-area" className="">
        
      </div>
      </div>
    </div>
  );
}

export default MenuDelDiaPrint;
