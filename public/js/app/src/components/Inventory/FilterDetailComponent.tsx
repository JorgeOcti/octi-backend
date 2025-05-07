import React = require("react");
import BootstrapSelect from "../Utils/BootstrapSelect";
import Checkbox from "../Utils/CheckBox";

interface FiltersProps {
    blFilter: string;
    containerFilter: string;
    clientFilter: string;
    clientSelector: string[];
    statusFilterSelected: string[];
    shipFilter: string[];
    shipSelector: string[];
    tripFilter: string[];
    tripSelector: string[];
    filterHasDamage: boolean;
    inventorySettings: any;
    statusText: any;
    onFilterChange: (filter: string, value: any) => void;
    onCleanFilters: () => void;
  }
  
  const Filters: React.FC<FiltersProps> = ({
    blFilter,
    containerFilter,
    clientFilter,
    clientSelector,
    statusFilterSelected,
    shipFilter,
    shipSelector,
    tripFilter,
    tripSelector,
    filterHasDamage,
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
              <label className="text-black">¿Qué Bill of Lading (BL) buscas?</label>
              <input
                type="text"
                className="form-control"
                value={blFilter}
                onChange={(e) => onFilterChange('blFilter', e.target.value)}
              />
            </div>
          </div>
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
              <label className="text-black">Cliente</label>
              <select
                className="form-control"
                value={clientFilter}
                onChange={(e) => onFilterChange('clientFilter', e.target.value)}
              >
                <option value="">Todos</option>
                {clientSelector
                  .sort((a, b) => a.localeCompare(b))
                  .map((client, index) => (
                    <option key={index} value={client}>{client}</option>
                  ))}
              </select>
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
        </div>
        <div className="row" style={{ margin: "10px 0" }}>
          <div className="col-md-3">
            <div className="form-group">
              <label className="text-black">Nave</label>
              <BootstrapSelect
                noneSelectedText="Todas las naves"
                displayItems={2}
                selectedText="Naves Seleccionadas."
                selected={shipFilter}
                autoClouse={true}
                search={true}
                allOption={false}
                options={shipSelector.map((ship) => ({
                  value: ship,
                  text: `${ship.toUpperCase()}`
                }))}
                onClick={(selected: any) => onFilterChange('shipFilter', [selected])}
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className="form-group">
              <label className="text-black">Viaje</label>
              <BootstrapSelect
                noneSelectedText="Todos los viajes"
                displayItems={2}
                selectedText="Viajes Seleccionados."
                selected={tripFilter}
                autoClouse={true}
                search={true}
                options={tripSelector.map((trip) => ({
                  value: trip,
                  text: `${trip.toUpperCase()}`
                }))}
                onClick={(selected: any) => onFilterChange('tripFilter', [selected])}
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className="checkbox">
              <label
                style={{ paddingLeft: '0', fontWeight: 600 }}
                onClick={() => {}}>
                <Checkbox
                  active={filterHasDamage}
                  action={() => onFilterChange('filterHasDamage', !filterHasDamage)}
                  classes="icheck-in-checkbox"
                  style={{ marginTop: '-4px', marginRight: '5px' }}
                />
                Mostrar solo unidades con daño
              </label>
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
  
  export { Filters };