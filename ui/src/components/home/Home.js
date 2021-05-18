import TabList from "../tab/TabList";
import ServiceStatusList from "../service/ServiceStatusList";
import { useEffect, useState } from "react";
import Grid from "@material-ui/core/Grid";
import { CircularProgress, makeStyles, Paper, Typography } from "@material-ui/core";

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

function Home() {
  const classes = useStyles();

  let services = {};
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  let [error, setError] = useState(null);
  const refreshSeconds = 10;
  const milliseconds = 1000;
  const interval = refreshSeconds * milliseconds;

  const fetchData = () => {
    fetch(`/api/v1/results`)
      .then((res) => res.json())
      .then(
        (result) => {
          setData(result);
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
  }, [interval]);



  const tempList = Object.keys(data);
  const defaultSelectedTabKey = "failing";
  const defaultSelectedServiceKey = null;

  let [selectedTeam, setSelectedTab] = useState(defaultSelectedTabKey);
  let [selectedService, setSelectedService] = useState(
    defaultSelectedServiceKey
  );

  services = data[selectedTeam];

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
        <Grid item xs={12}>
          <Typography>Refresh Interval: {`${refreshSeconds} s`}</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default Home;
