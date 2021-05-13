import { makeStyles, MenuItem } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  menuItem: {
    borderRadius: 50,
    float: "left",
    color: "#292F36",
    fontSize: "20px",
    cursor: "pointer",
  },
  selectedItem: {
    backgroundColor: "#4ecdc4",
    color: "white",
    "&:hover": {
      background: "#4ecdc4",
    },
  },
}));

function Tab(props) {
  const classes = useStyles();
  let menuItemClasses = `${classes.menuItem}`;
  if (props.selectedTab === props.name) {
    menuItemClasses = `${classes.menuItem} ${classes.selectedItem}`;
  }

  function clickHandler() {
    props.click(props.name);
  }

  return (
    <MenuItem tabIndex={1} className={menuItemClasses} onClick={clickHandler}>
      {props.name}
    </MenuItem>
  );
}

export default Tab;
