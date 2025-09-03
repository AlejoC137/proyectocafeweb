import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, Table, Save, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExcelViewBase({ 
  data = [], 
  columns = [],
  onEdit,
  onSave, 
  onDelete,
  showEdit = false,
  groupByField = null,
  filterFields = [],
  title = "Vista Excel",
  enableGrouping = true,
  enableFilters = true,
  enableSorting = true,
  customActions = null
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [filterValues, setFilterValues] = useState({});
  const [editingRows, setEditingRows] = useState(new Set());

  // Generate filter options based on data
  const filterOptions = useMemo(() => {
    const options = {};
    filterFields.forEach(field => {
      if (field.type === 'select') {
        const uniqueValues = [...new Set(data.map(item => item[field.key]).filter(Boolean))];
        options[field.key] = uniqueValues;
      }
    });
    return options;
  }, [data, filterFields]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply text search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        columns.some(col => {
          const value = item[col.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply group filter
    if (groupByField && selectedGroup !== "all") {
      filtered = filtered.filter(item => item[groupByField] === selectedGroup);
    }

    // Apply custom filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== "all") {
        filtered = filtered.filter(item => item[key] === value);
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = aValue.toString().localeCompare(bValue.toString());
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, selectedGroup, filterValues, sortConfig, columns, groupByField]);

  // Group options
  const groupOptions = useMemo(() => {
    if (!groupByField || !data.length) return [];
    const groups = [...new Set(data.map(item => item[groupByField]).filter(Boolean))];
    return groups.sort();
  }, [data, groupByField]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: data.length,
      filtered: processedData.length,
      groups: groupOptions.length
    };
  }, [data.length, processedData.length, groupOptions.length]);

  const handleSort = (key) => {
    if (!enableSorting) return;
    
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (row) => {
    if (onEdit) onEdit(row);
    setEditingRows(prev => new Set([...prev, row.id || JSON.stringify(row)]));
  };

  const handleSave = (row) => {
    if (onSave) onSave(row);
    setEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(row.id || JSON.stringify(row));
      return newSet;
    });
  };

  const handleDelete = (row) => {
    if (onDelete) onDelete(row);
  };

  const isEditing = (row) => editingRows.has(row.id || JSON.stringify(row));

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const renderCell = (item, column) => {
    const value = item[column.key];
    const editing = isEditing(item);

    if (editing && column.editable && showEdit) {
      if (column.type === 'select') {
        return (
          <Select value={value || ""} onValueChange={(newValue) => {
            // Update item value here if needed
          }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else if (column.type === 'number') {
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => {
              // Update item value here if needed
            }}
            className="h-8 text-xs"
          />
        );
      } else {
        return (
          <Input
            value={value || ""}
            onChange={(e) => {
              // Update item value here if needed
            }}
            className="h-8 text-xs"
          />
        );
      }
    }

    // Read-only display
    if (column.render) {
      return column.render(value, item);
    }

    if (column.type === 'badge') {
      return (
        <Badge variant={column.getBadgeVariant?.(value) || "secondary"} className="text-xs">
          {value}
        </Badge>
      );
    }

    if (column.type === 'number') {
      return <span className="text-right font-mono">{value?.toLocaleString?.() || value}</span>;
    }

    return <span className="truncate" title={value}>{value}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Elementos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filtrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.filtered}</div>
          </CardContent>
        </Card>
        
        {enableGrouping && groupByField && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.groups}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      {(enableFilters || enableGrouping) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Group Filter */}
              {enableGrouping && groupByField && groupOptions.length > 0 && (
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grupos</SelectItem>
                    {groupOptions.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Custom Filters */}
              {filterFields.map(field => (
                <div key={field.key}>
                  {field.type === 'select' && (
                    <Select 
                      value={filterValues[field.key] || "all"} 
                      onValueChange={(value) => setFilterValues(prev => ({ ...prev, [field.key]: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.label} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {filterOptions[field.key]?.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Actions */}
            {customActions && (
              <div className="flex gap-2 pt-2 border-t">
                {customActions}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Excel Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Table className="h-5 w-5" />
            {title} - Vista Tabla
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b">
                  {columns.map((column) => (
                    <th 
                      key={column.key}
                      className={cn(
                        "text-left p-3 font-semibold text-sm border-r last:border-r-0",
                        enableSorting && "cursor-pointer hover:bg-muted/70 select-none"
                      )}
                      onClick={() => handleSort(column.key)}
                      style={{ minWidth: column.minWidth || "120px" }}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {enableSorting && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                  {showEdit && (
                    <th className="text-left p-3 font-semibold text-sm w-32">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {processedData.map((item, index) => (
                  <tr key={index} className={cn(
                    "border-b hover:bg-muted/30 transition-colors",
                    index % 2 === 0 ? "bg-white" : "bg-muted/10"
                  )}>
                    {columns.map((column) => (
                      <td key={column.key} className="p-3 border-r last:border-r-0 text-sm">
                        {renderCell(item, column)}
                      </td>
                    ))}
                    {showEdit && (
                      <td className="p-3 text-sm">
                        <div className="flex gap-1">
                          {!isEditing(item) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSave(item)}
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {processedData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay datos que mostrar</p>
              <p className="text-sm">Los elementos aparecerán aquí cuando coincidan con los filtros</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
