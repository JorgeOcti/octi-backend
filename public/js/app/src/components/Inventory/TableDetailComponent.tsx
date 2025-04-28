import * as React from 'react';
import DataTable from 'react-data-table-component';


interface InventoryDetailProps {
    columns: any[]; // definicion de columnas
    containers: any[]; // Recibe un array de DatoTabla (ya filtrado),\
    dataTableStyle: {};
    conditionalRowStyles: any[];
    paginationComponentOptions: {};
}

const TableDetail: React.FC<InventoryDetailProps> = ({ columns, containers, dataTableStyle, conditionalRowStyles, paginationComponentOptions }) => {

    if (containers.length === 0) {
        return <p>No hay datos que coincidan con los filtros.</p>;
    }

    const ExpandedRowElement = ({ data }: { data: any }) => {
        return <div>test</div>
    }

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

export default TableDetail;