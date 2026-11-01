@echo off
title Actualizar Catalogo Supermu
echo ========================================================
echo  Extrayendo productos de Supermu (Carnes, Frutas, Despensa, Desayuno...)
echo ========================================================
python "%~dp0export_supermu.py"
python -c "import json; data=json.load(open(r'%~dp0supermu_products.json', encoding='utf-8')); open(r'%~dp0products_data.js', 'w', encoding='utf-8').write('window.SUPERMU_DATA = ' + json.dumps(data, ensure_ascii=False) + ';'); print('[OK] products_data.js actualizado')"
echo.
echo ========================================================
echo  Completado exitosamente!
echo ========================================================
pause
