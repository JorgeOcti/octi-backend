import * as React from 'react';
import DataTable from 'react-data-table-component';


const InventoryTable = ({
    columns,
    containers,
    conditionalRowStyles,
    dataTableStyle,
    paginationComponentOptions,
    ExpandedRowElement,
    paginationServer,
    totalRows,
    OnChangePage,
    OnChangeRowsPerPage
  }: {
    columns: Array<any>;
    containers: Array<any>;
    conditionalRowStyles: Array<any>;
    dataTableStyle: any;
    paginationComponentOptions: any;
    ExpandedRowElement: React.FC<{ data: any }>;
    paginationServer: boolean;
    totalRows: number;
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
            paginationServer={paginationServer}
            paginationTotalRows={totalRows}
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