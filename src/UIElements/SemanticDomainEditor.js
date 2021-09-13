/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// React imports
import React, { useRef, useCallback, useState } from 'react';
import Paper from '@material-ui/core/Paper';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import GridMUI from '@material-ui/core/Grid';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { withStyles } from '@material-ui/core/styles';
import { EditingState } from '@devexpress/dx-react-grid';

import saveAs from 'file-saver';

import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'
import Button from 'react-bootstrap/Button'

import { GridExporter } from '@devexpress/dx-react-grid-export';

import {
    Grid,
    Table,
    TableHeaderRow,
    TableInlineCellEditing,
    Toolbar,
    ExportPanel,
} from '@devexpress/dx-react-grid-material-ui';

import {
    Plugin,
    Template,
    TemplatePlaceholder,
} from '@devexpress/dx-react-core';

// In program imports
import {currentObjects} from "./CanvasDraw";

// Globals
var rows;
var setRows = null;
var setColumns = null;
var textInput = React.createRef();
export var translationColumns = [];

const onSave = (workbook) => {
    workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'DataGrid.xlsx');
    });
};

const getRowId = row => row.id;

const styles = () => ({
    input: {
        fontSize: '14px',
        width: '90px',
    },
    label: {
        fontSize: '14px',
    },
    container: {
        maxWidth: '18em',
    },
    selector: {
        height: '32px',
    },
});

// #FOLD_BLOCK
const StartEditActionSelectorBase = (props) => {
    const { defaultAction, changeAction, classes } = props;
    return (
        <GridMUI
            container
            alignItems="center"
            className={classes.container}
        >
            <Typography
                className={classes.label}
            >
                Start Edit Action:
                &nbsp;
            </Typography>
            <Select
                onChange={e => changeAction(e.target.value)}
                value={defaultAction}
                className={classes.selector}
                input={(
                    <OutlinedInput
                        classes={{ input: classes.input }}
                        labelWidth={0}
                        margin="dense"
                    />
                )}
            >
                <MenuItem value="click">Click</MenuItem>
                <MenuItem value="doubleClick">Double Click</MenuItem>
            </Select>
        </GridMUI>
    );
};
const StartEditActionSelector = withStyles(styles, { name: 'StartEditActionSelector' })(StartEditActionSelectorBase);

// #FOLD_BLOCK
const SelectTextCheckerBase = (props) => {
    const { isSelectText, changeSelectText, classes } = props;
    return (
        <FormControlLabel
            control={(
                <Checkbox
                    checked={isSelectText}
                    onChange={e => changeSelectText(e.target.checked)}
                    color="primary"
                />
            )}
            classes={{ label: classes.label }}
            label="Select Text On Focus"
        />
    );
};
const SelectTextChecker = withStyles(styles, { name: 'SelectTextChecker' })(SelectTextCheckerBase);

const EditPropsPanel = props => (
    <Plugin name="EditPropsPanel">
        <Template name="toolbarContent">
            <SelectTextChecker {...props} />
            <TemplatePlaceholder />
            <StartEditActionSelector {...props} />
        </Template>
    </Plugin>
);

const FocusableCell = ({ onClick, ...restProps }) => (
    <Table.Cell {...restProps} tabIndex={0} onFocus={onClick} />
);

export default () => {
    // Create columns
    var [columns, setColumnsRet] = useState(createColumns());
    setColumns = setColumnsRet;

    // Disable editing state
    const [editingStateColumnExtensions] = useState([
        { columnName: 'UUID', editingEnabled: false },
        { columnName: 'type', editingEnabled: false },
    ]);

    // Rows
    const [generatedRows, setRowsRet] = useState([]);
    rows = generatedRows;
    setRows = setRowsRet;

    // Enable/Disable word Wrap
    const [tableColumnExtensions] = useState([
        { columnName: 'UUID', wordWrapEnabled: true },
        { columnName: 'type', wordWrapEnabled: true },
        { columnName: 'name', wordWrapEnabled: true },
        { columnName: 'description', wordWrapEnabled: true },
        { columnName: 'abbreviation', wordWrapEnabled: true },
        { columnName: 'shortAbbreviation', wordWrapEnabled: true },
    ]);

    // Editable
    const [startEditAction, setStartEditAction] = useState('click');
    const [selectTextOnEditStart, setSelectTextOnEditStart] = useState(true);

    const commitChanges = ({ added, changed, deleted}) => {
        let changedRows;
        if (added) {
            const startingAddedId = rows.length > 0 ? rows[rows.length - 1].id + 1 : 0;
            changedRows = [
                ...rows,
                ...added.map((row, index) => ({
                    id: startingAddedId + index,
                    ...row,
                })),
            ];
        }
        if (changed) {
            changedRows = rows.map(row => (changed[row.id] ? { ...row, ...changed[row.id] } : row));
            updateChangedObjects(changedRows);
        }
        if (deleted) {
            const deletedSet = new Set(deleted);
            changedRows = rows.filter(row => !deletedSet.has(row.id));
        }

        setRows(changedRows);
    };

    // Export functionality
    const exporterRef = useRef(null);

    const startExport = useCallback(() => {
        exporterRef.current.exportGrid();
    }, [exporterRef]);

    // Return
    return (
        <Paper>
            <InputGroup>
                <FormControl
                    ref={textInput}
                    placeholder="Column name"
                    aria-label="Column name"
                    aria-describedby="basic-addon2"
                />
                <InputGroup.Append>
                    <Button variant="outline-secondary" onClick={() => addColumn()}>Add</Button>
                    <Button variant="outline-secondary" onClick={() => removeColumn()}>Remove</Button>
                </InputGroup.Append>
            </InputGroup>
            <Grid
                rows={rows}
                columns={columns}
                getRowId={getRowId}
            >
                <EditingState
                    onCommitChanges={commitChanges}
                    columnExtensions={editingStateColumnExtensions}
                />
                <Table cellComponent={FocusableCell} columnExtensions={tableColumnExtensions} />
                <TableHeaderRow />
                <Toolbar />
                <EditPropsPanel
                    defaultAction={startEditAction}
                    changeAction={setStartEditAction}
                    isSelectText={selectTextOnEditStart}
                    changeSelectText={setSelectTextOnEditStart}
                />
                <ExportPanel startExport={startExport} />
                <TableInlineCellEditing
                    startEditAction={startEditAction}
                    selectTextOnEditStart={selectTextOnEditStart}
                />
            </Grid>
            <GridExporter
                ref={exporterRef}
                rows={rows}
                columns={columns}
                onSave={onSave}
            />
        </Paper>
    );
};

function addColumn() {
    // Get
    const value = textInput.current.value

    // Clear column name
    textInput.current.value = "";

    // Check if value is empty
    if (value === "" || value === null || value === undefined) {
        return;
    }

    // Add column
    translationColumns.push(value);
    updateColumns();
}

function removeColumn() {
    // Get
    const value = textInput.current.value

    // Clear column name
    textInput.current.value = "";

    // Delete from currentObjects
    for (let object of currentObjects.flatten()) {
        object.semanticIdentity.translations.delete(value);
    }

    // Delete column
    translationColumns.splice(translationColumns.indexOf(value), 1);
    updateColumns();
}

function updateColumns() {
    setColumns(createColumns());
}

function getRowForObject(object) {
    const row = {};

    // Constants
    row['id'] = object.semanticIdentity.UUID; // Just going to be based on UUID since it's easy and unique
    row['UUID'] = object.semanticIdentity.UUID;
    row['type'] = object.constructor.name;
    row['name'] = object.semanticIdentity.name;
    row['description'] = object.semanticIdentity.description;
    row['abbreviation'] = object.semanticIdentity.abbreviation;
    row['shortAbbreviation'] = object.semanticIdentity.shortAbbreviation;

    // Translations
    for (let o = 0; o < object.semanticIdentity.translations.length; o++) {
        let translation = object.semanticIdentity.translations[o];

        row[translation[0]] = translation[1];
    }

    return row;
}

export function resetRows() {
    var newRows = []
    var currentObjectsFlattened = currentObjects.flatten();

    for (let i = 0; i < currentObjectsFlattened.length; i++) {
        newRows.push(getRowForObject(currentObjectsFlattened[i]));

        // Add Arrow Ends
        if (currentObjectsFlattened[i].constructor.name === "Arrow") {
            newRows.push(getRowForObject(currentObjectsFlattened[i].sourceEdgeEnd));
            newRows.push(getRowForObject(currentObjectsFlattened[i].destEdgeEnd));
        }
    }

    if (setRows === null) {
        console.error("Cannot set rows");
        return;
    }

    setRows(newRows);
}

function createColumns() {
    // Create default columns
    var columnNames = [
        { name: 'UUID', title: 'UUID' },
        { name: 'type', title: 'Type' },
        { name: 'name', title: 'Name' },
        { name: 'description', title: 'Description' },
        { name: 'abbreviation', title: 'Abbreviation' },
        { name: 'shortAbbreviation', title: 'Short Abbreviation' },
    ];

    // Add translation columns
    for (let translation of translationColumns) {
        columnNames.push({name: translation, title: translation});
    }

    return columnNames;
}

function updateChangedObject(object, row) {
    // If should update
    if (object.semanticIdentity.UUID === row['UUID']) {
        // Constants
        object.semanticIdentity.abbreviation = row['abbreviation'];
        object.semanticIdentity.shortAbbreviation = row['shortAbbreviation'];
        object.semanticIdentity.name = row['name'];
        object.semanticIdentity.description = row['description'];

        // Translations
        for (let translation of translationColumns) {
            // Find translation in list
            var set = false;
            for (let i = 0; i < object.semanticIdentity.translations.length; i++) {
                if (object.semanticIdentity.translations[i][0] === translation) {
                    object.semanticIdentity.translations[i][1] = row[translation];
                    set = true;
                    break;
                }
            }

            if (!set) {
                object.semanticIdentity.translations.push([translation, row[translation]]);
            }
        }
    }

    return row;
}

function updateChangedObjects(rows) {
    var currentObjectsFlattened = currentObjects.flatten();
    
    // Iterate through all rows
    for (let i = 0; i < rows.length; i++) {
        // Iterate through all objects
        for (let o = 0; o < currentObjectsFlattened.length; o++) {
            // Update main objects
            rows[i] = updateChangedObject(currentObjectsFlattened[o], rows[i]);

            // Update edge ends
            if (currentObjectsFlattened[o].constructor.name === "Arrow") {
                rows[i] = updateChangedObject(currentObjectsFlattened[o].sourceEdgeEnd, rows[i]);
                rows[i] = updateChangedObject(currentObjectsFlattened[o].destEdgeEnd, rows[i]);
            }
        }
    }
}

export function setTranslationColumns(newColumns) {
    translationColumns = newColumns;
    updateColumns();
}