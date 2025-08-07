import * as React from 'react';
import DataTable from 'react-data-table-component';


const InventoryTable = ({
    columns,
    containers,
    conditionalRowStyles,
    dataTableStyle,
    paginationComponentOptions,
    ExpandedRowElement
  }: {
    columns: Array<any>;
    containers: Array<any>;
    conditionalRowStyles: Array<any>;
    dataTableStyle: any;
    paginationComponentOptions: any;
    ExpandedRowElement: React.FC<{ data: any }>;
  }) => {
    return (
      <div className="row">
        <div className="col-md-12">
          <DataTable
            columns={columns}
            data={containers}
            customStyles={dataTableStyle}
            expandableRows
            expandableRowDisabled={(container: any) => (!container.units || container.units.length === 0) && (!container.cars || container.cars.length === 0)}
            expandableRowsComponent={ExpandedRowElement}
            expandOnRowClicked={true}
            pagination
            conditionalRowStyles={conditionalRowStyles}
            paginationComponentOptions={paginationComponentOptions}
            noDataComponent={
              <div className="text-center">
                <h4>No hay datos</h4>
              </div>
            }
          />
        </div>
      </div>
    );
  };
  

  export { InventoryTable };