import { DialogTitle, Divider, makeStyles } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Button from "@material-ui/core/Button";
import { Card, CardContent } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  paper: {
    cursor: "pointer",
    height: 120,
    flexWrap: "wrap",
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    paddingTop: 50,
    borderRadius: 25,
    fontSize: "16px",
  },
  successContainer: {
    background: "#83BD0F",
  },
  failureContainer: {
    background: "#DB324D",
  },
  grid: {
    margin: 16,
    padding: 16,
  },
  header: {
    textAlign: "center",
    margin: 16,
  },
  cardContainer: {
    width: "450px",
  },
  cardContent: {
    background: "white",
    color: "black",
    fontSize: "15px",
  },
  successIndicator: {
    border: "1px solid #83BD0F",
  },
  failureIndicator: {
    border: "1px solid #DB324D",
  },
  ul: {
    padding: "0",
  },
  table: {
    display: "table",
  },
  successExpression: {
    backgroundColor: "#83BD0F",
    color: "white",
    fontWeight: "bold",
  },
  failureExpression: {
    backgroundColor: "#DB324D",
    color: "white",
    fontWeight: "bold",
  },
  text: {
    paddingLeft: "10px"
  }
}));

function prettifyTimestamp(timestamp) {
  let date = new Date(timestamp);
  let YYYY = date.getFullYear();
  let MM = (date.getMonth() + 1 < 10 ? "0" : "") + "" + (date.getMonth() + 1);
  let DD = (date.getDate() < 10 ? "0" : "") + "" + date.getDate();
  let hh = (date.getHours() < 10 ? "0" : "") + "" + date.getHours();
  let mm = (date.getMinutes() < 10 ? "0" : "") + "" + date.getMinutes();
  let ss = (date.getSeconds() < 10 ? "0" : "") + "" + date.getSeconds();
  return YYYY + "-" + MM + "-" + DD + " " + hh + ":" + mm + ":" + ss;
}

function ServiceDetail(props) {
  const classes = useStyles();
  const status = `${props.data.status}`;
  const hostname = `${props.data.hostname}`;
  const duration = `${parseInt(props.data.duration / 1000000)} ms`;
  const timestamp = prettifyTimestamp(props.data.timestamp);
  const conditions = props.data["condition-results"];

  return (
    <Card className={`${classes.cardContainer} ${props.data.success? classes.successIndicator : classes.failureIndicator}`}>
      <CardContent>
        <div>
          <div className="row">
            <div className="card-content">
              <table className={classes.table}>
                <tbody>
                  <tr>
                    <th scope="row" style={{ textAlign: "left" }}>
                      Status:
                    </th>
                    <td style={{ textAlign: "right" }}>{status}</td>
                  </tr>

                  <tr>
                    <th scope="row" style={{ textAlign: "left" }}>
                      Hostname:
                    </th>
                    <td style={{ textAlign: "right" }}>{hostname}</td>
                  </tr>
                  <tr>
                    <th scope="row" style={{ textAlign: "left" }}>
                      Duration
                    </th>
                    <td style={{ textAlign: "right" }}>{duration}</td>
                  </tr>
                  <tr>
                    <th scope="row" style={{ textAlign: "left" }}>
                      Timestamp:
                    </th>
                    <td style={{ textAlign: "right" }}>{timestamp}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <br />
          <div>
            <Divider />
            <ul className={classes.ul}>Conditions:</ul>
            {conditions.map((conditionItem, index) => (
              <li
                key={index}
                className={
                  `${classes.text} ${conditionItem["success"]
                    ? classes.successExpression
                    : classes.failureExpression}`
                }
              >
                {conditionItem["condition"]}
              </li>
            ))}
          </div>
          {props.data.errors.length > 0 && (
            <div>
              <Divider />
              <ul className={classes.ul}>Errors:</ul>
              {props.data.errors.map((error, index) => (
                <li key={index} className={classes.failureExpression}>
                  {error}
                </li>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
function ServiceStatus(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");

  const paperClasses = `${classes.paper} ${
    props.success ? classes.successContainer : classes.failureContainer
  }`;

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const descriptionElementRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  function clickHandler() {
    props.click(props.serviceName);
  }

  return (
    <Grid item xs={12} sm={3} onClick={clickHandler} key={props.serviceName}>
      <div>
        <Paper
          square
          elevation={6}
          className={paperClasses}
          onClick={handleClickOpen("paper")}
        >
          <div className={classes.text}> {props.serviceName}</div>
        </Paper>
        <Dialog
          open={open}
          onClose={handleClose}
          scroll={scroll}
          aria-labelledby="scroll-dialog-title"
          aria-describedby="scroll-dialog-description"
        >
          <DialogTitle className={classes.header}>
            {props.serviceName.toUpperCase()}
          </DialogTitle>
          <DialogContent dividers={scroll === "paper"}>
            <Grid
              className={classes.grid}
              container
              justify="center"
              alignItems="center"
              spacing={1}
            >
              {props.detailList.map((details, index) => (
                <Grid item>
                  <ServiceDetail key={index} data={details} />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Grid>
  );
}

function ServiceStatusList(props) {
  const sortedDetailList = (service) => {
    if (props.services[service] === undefined) {
      return [];
    }
    return props.services[service].sort(function (a, b) {
      return b.timestamp.localeCompare(a.timestamp);
    });
  };
  const latestStatusObj = (service) => sortedDetailList(service)[0];
  let selectedServiceDetails = [];
  if (props.selectedService != null) {
    selectedServiceDetails = sortedDetailList(props.selectedService) || [];
  }

  return (
    <div>
      <Grid container spacing={5}>
        {Object.keys(props.services).map((service, index) => (
          <ServiceStatus
            key={index}
            serviceName={service}
            success={latestStatusObj(service).success}
            detailList={selectedServiceDetails}
            click={props.click}
          />
        ))}
      </Grid>
    </div>
  );
}

export default ServiceStatusList;
