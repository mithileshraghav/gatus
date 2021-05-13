import TabList from "../tab/TabList";
import ServiceStatusList from "../service/ServiceStatusList";
import { useEffect, useState } from "react";
import Grid from "@material-ui/core/Grid";
import { CircularProgress, makeStyles, Paper } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  paperContainer: {
    padding: "35px",
  },
  loader: {
    width: "100%",
    marginTop: "50%",
    marginLeft: "50%"
  }
}));

function Example() {
  const classes = useStyles();

  let services = {};
  const [myObj, setMyObj] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  let [error, setError] = useState(null);
  const interval = 10000;

  const fetchData = () => {
    fetch(`${process.env.REACT_APP_SERVER_URL}api/v1/results`)
      .then((res) => res.json())
      .then(
        (result) => {
          console.log("hello")
          setMyObj(result);
          setIsLoading(false);
        },
        (error) => {
          setError(error);
          setIsLoading(false);
        }
      );
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, interval);

    return () => {
      clearInterval(timer)
    }
  }, []);



  const tempList = Object.keys(myObj);
  const defaultSelectedTabKey = "failing";
  const defaultSelectedServiceKey = null;

  let [selectedTeam, setSelectedTab] = useState(defaultSelectedTabKey);
  let [selectedService, setSelectedService] = useState(
    defaultSelectedServiceKey
  );

  services = myObj[selectedTeam];

  if (isLoading) {
    return (
      <div className={classes.loader}>
        <CircularProgress size={70} />
      </div>
    );
  }

  if (error != null) {
    return (
      <div>
        Something went wrong. Please try again or contact the devops team.
      </div>
    );
  }

  return (
    <Paper className={classes.paperContainer} elevation={5}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h1 style={{ textAlign: "center", color: "grey" }}>
            Health Dashboard
          </h1>
        </Grid>
        <Grid item xs={12}>
          <TabList
            selectedTab={selectedTeam}
            tabList={tempList}
            click={setSelectedTab}
          ></TabList>
        </Grid>
        <Grid item xs={12}>
          <ServiceStatusList
            selectedTeam={selectedTeam}
            selectedService={selectedService}
            services={services}
            click={setSelectedService}
          ></ServiceStatusList>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default Example;
