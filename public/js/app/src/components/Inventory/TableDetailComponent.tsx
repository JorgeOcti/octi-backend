import * as React from 'react';
import DataTable from 'react-data-table-component';


const InventoryTable = ({
    columns,
    containers,
    conditionalRowStyles,
    dataTableStyle,
    paginationComponentOptions,
    ExpandedRowElement,
    OnChangePage,
    OnChangeRowsPerPage
  }: {
    columns: Array<any>;
    containers: Array<any>;
    conditionalRowStyles: Array<any>;
    dataTableStyle: any;
    paginationComponentOptions: any;
    ExpandedRowElement: React.FC<{ data: any }>;
    OnChangePage?: (page: number) => void;
    OnChangeRowsPerPage?: (newPerPage: number, page: number) => void;
  }) => {
    return (
      <div className="row">
        <div className="col-md-12">
          <DataTable
            columns={columns}
            data={containers}
            customStyles={dataTableStyle}
            expandableRows
            expandableRowsComponent={ExpandedRowElement}
            expandOnRowClicked={true}
            pagination
            conditionalRowStyles={conditionalRowStyles}
            paginationComponentOptions={paginationComponentOptions}
            onChangePage={OnChangePage}
            onChangeRowsPerPage={OnChangeRowsPerPage}
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