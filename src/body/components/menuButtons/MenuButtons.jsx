import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productsByCat, setCat } from '../../../redux/actions';

function MenuButtons({ categories }) {
  const dispatch = useDispatch();
  const [selectedCat, setSelectedCat] = useState('');
  const menuAnt = useSelector(state => state.menu);

  useEffect(() => {
    dispatch(productsByCat("TODO", menuAnt));
  }, []);

  const handleOnClickCat = (category) => {
  setSelectedCat(category)
    category === 'Todo' ||  category === "Show all" ? dispatch(setCat('TODO')) : dispatch(setCat(category))
    // dispatch(productsByCat(category, menuAnt));
  };

  return (
    <div className="grid grid-cols-3 gap-1 mb-1 border pb-1 border-b-lilaDark ">

      
      {categories.map((category, index) => (
        <button
          key={index}
          onClick={() => handleOnClickCat(category)}
          className={`w-full  mr-1 rounded-2xl border border-lilaDark p-1 font-Bobby_Jones_Soft text-lilaDark  text-15pt text-center ${
            selectedCat === category ? 'bg-ladrillo text-notBlack' : 'bg-softGrey text-cream'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default MenuButtons;
