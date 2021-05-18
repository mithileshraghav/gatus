import { MenuList } from "@material-ui/core";
import React from "react";
import Tab from "./Tab";

function TabList(props) {
  return (
      <MenuList spacing={1}>
        {props.tabList.map((tabName, index) => (
            <Tab selectedTab={props.selectedTab} key={index} name={tabName} click={props.click}></Tab>
        ))}
      </MenuList>
  );
}

export default TabList;
