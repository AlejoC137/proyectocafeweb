import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import StaffInstance from "./StaffInstance";
// import { getAllFromTable } from "../../../redux/actions-WorkIsue";
import { STAFF } from "../../../redux/actions-types";
import { getAllFromTable } from "../../../redux/actions-Proveedores";
// getAllFromTable
function StaffOrdered({ ventas, reloadVentas, onPagar }) {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        await dispatch(getAllFromTable(STAFF));
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    };

    fetchStaff();
  }, [dispatch]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {allStaff.map((staff) => (
        <StaffInstance
          key={staff._id}
          staff={staff}
          ventas={ventas}
          reloadVentas={reloadVentas}
          onPagar={onPagar}
        />
      ))}
    </div>
  );
}

export default StaffOrdered;
