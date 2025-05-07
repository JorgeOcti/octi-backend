import React = require("react");
import BootstrapSelect from "../Utils/BootstrapSelect";

interface FiltersProps {
    unitFilter: string;
    containerFilter: string;
    statusFilterSelected: string[];
    inventorySettings: any;
    statusText: any;
    onFilterChange: (filter: string, value: any) => void;
    onCleanFilters: () => void;
  }
  
  const FilterSummryDetail: React.FC<FiltersProps> = ({
    unitFilter,
    containerFilter,
    statusFilterSelected,
    inventorySettings,
    statusText,
    onFilterChange,
    onCleanFilters
  }) => {
  
    return (
      <div>
        <div className="row" style={{ margin: "10px 0" }}>
          <div className="col-md-3">
            <div className="form-group">
              <label className="text-black">¿Qué contenedor buscas?</label>
              <input
                type="text"
                className="form-control"
                value={containerFilter}
                onChange={(e) => onFilterChange('containerFilter', e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className="form-group">
              <label className="text-black">¿Qué unidad buscas?</label>
              <input
                type="text"
                className="form-control"
                value={unitFilter}
                onChange={(e) => onFilterChange('unitFilter', e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <div className="form-group">
              <label className="text-black">Filtrar por Estado</label>
              <BootstrapSelect
                noneSelectedText="Todos"
                displayItems={4}
                sm={true}
                selectedText="estados seleccionados."
                separator=" - "
                options={Object.keys(statusText).map((status) => ({
                  value: status,
                  text: inventorySettings[status],
                  className: `label label-${inventorySettings[`${status}Class`]}`
                }))}
                selected={statusFilterSelected}
                onClick={(e: string) => {
                  const filters = statusFilterSelected.includes(e)
                    ? statusFilterSelected.filter((state) => state !== e)
                    : [e, ...statusFilterSelected];
                  onFilterChange('statusFilterSelected', filters);
                }}
              />
            </div>
          </div>

          <div className="col-md-3">
            <div className='form-group'>
              <div className="row pull-left box-tools clean-filter-wrapper">
                <button
                  className="btn btn-sm btn-outline-default text-dark btn-block"
                  onClick={onCleanFilters}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  };
  
  export { FilterSummryDetail };