import React from 'react';

function NavBar({ groupedItems, scrollToCategory }) {
    return (
        <div className="fixed top-0 left-0 w-full bg-gray-800 text-white z-50">
            <div className="container mx-auto flex justify-center py-4 space-x-4">
                {Object.keys(groupedItems).map((category) => (
                    <button
                        key={category}
                        onClick={() => scrollToCategory(category.toUpperCase())}
                        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
                    >
                        {category.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default NavBar;
