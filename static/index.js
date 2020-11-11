let serviceStatuses = {};
let timerHandler = 0;
let refreshIntervalHandler = 0;
let userClickedStatus = false;

function showTooltip(serviceGroup, serviceName, index, element) {
    userClickedStatus = false;
    clearTimeout(timerHandler);
    let serviceResult = serviceStatuses[serviceGroup][serviceName][index];
    $("#tooltip-timestamp").text(prettifyTimestamp(serviceResult.timestamp));
    $("#tooltip-response-time").text(parseInt(serviceResult.duration/1000000) + "ms");
    // Populate the condition section
    let conditions = "";
    for (let i in serviceResult['condition-results']) {
        let conditionResult = serviceResult['condition-results'][i];
        conditions += (conditionResult.success ? "&#10003;" : "X") + " ~ " + htmlEntities(conditionResult.condition) + "<br />";
    }
    $("#tooltip-conditions").html(conditions);
    // Populate the error section only if there are errors
    if (serviceResult.errors && serviceResult.errors.length > 0) {
        let errors = "";
        for (let i in serviceResult.errors) {
            errors += "- " + htmlEntities(serviceResult.errors[i]) + "<br />";
        }
        $("#tooltip-errors").html(errors);
        $("#tooltip-errors-container").show();
    } else {
        $("#tooltip-errors-container").hide();
    }
    // Position tooltip
    $("#tooltip").css({top: "0px", left: "0px"}).show();
    let targetTopPosition = element.getBoundingClientRect().y + 30;
    let targetLeftPosition = element.getBoundingClientRect().x;
    // Make adjustments if necessary
    let tooltipBoundingClientRect = document.querySelector('#tooltip').getBoundingClientRect();
    if (targetLeftPosition + window.scrollX + tooltipBoundingClientRect.width + 50 > document.body.getBoundingClientRect().width) {
        targetLeftPosition = element.getBoundingClientRect().x - tooltipBoundingClientRect.width + element.getBoundingClientRect().width;
        if (targetLeftPosition < 0) {
            targetLeftPosition += -targetLeftPosition;
        }
    }
    if (targetTopPosition + window.scrollY + tooltipBoundingClientRect.height + 50 > document.body.getBoundingClientRect().height && targetTopPosition >= 0) {
        targetTopPosition = element.getBoundingClientRect().y - (tooltipBoundingClientRect.height + 10);
        if (targetTopPosition < 0) {
            targetTopPosition = element.getBoundingClientRect().y + 30;
        }
    }
    $("#tooltip").css({top: targetTopPosition + "px", left: targetLeftPosition + "px"});
}

function fadeTooltip() {
    if (!userClickedStatus) {
        timerHandler = setTimeout(function () {
            $("#tooltip").hide();
        }, 500);
    }
}

function createStatusBadge(serviceGroup, serviceName, index, success) {
    if (success) {
        return "<span class='status badge badge-success' style='width: 5%' onmouseenter='showTooltip(\""+serviceGroup+"\", \""+serviceName+"\", "+index+", this)' onmouseleave='fadeTooltip()' onclick='userClickedStatus = !userClickedStatus;'>&#10003;</span>";
    }
    return "<span class='status badge badge-danger' style='width: 5%' onmouseenter='showTooltip(\""+serviceGroup+"\", \""+serviceName+"\", "+index+", this)' onmouseleave='fadeTooltip()' onclick='userClickedStatus = !userClickedStatus;'>X</span>";
}

function refreshResults() {
    $.getJSON("/api/v1/results", function (data) {
        // Update the table only if there's a change
        if (JSON.stringify(serviceStatuses) !== JSON.stringify(data)) {
            serviceStatuses = data;
            buildTabs();
        }
    });
}

function buildTabs(){
    
    $("#service-groups").empty()
    $("#results").empty()

    let active = ""
    for (let serviceGroup in serviceStatuses) {
        if(serviceGroup == "failing"){
            active = "active"
        }
        let output = "";
        output += ""
            + "	<li class='nav-item'>"
            + "	<a class='nav-link " + active + "' id='" + serviceGroup + "-tab' data-toggle='pill' href='#" + serviceGroup + "' role='tab' aria-controls='" + serviceGroup+ "-tab' aria-selected='false'>" + serviceGroup + "</a>"
            + "	</li>";
        $("#service-groups").append(output);
        buildTable(serviceGroup, serviceStatuses[serviceGroup], active)
        active = ""
    }

    
}

function buildTable(serviceGroup, serviceResults, active) {
    let output = "";
    for (let serviceName in serviceResults) {
        let serviceStatusOverTime = "";
        let hostname = serviceResults[serviceName][serviceResults[serviceName].length-1].hostname
        let minResponseTime = null;
        let maxResponseTime = null;
        let newestTimestamp = null;
        let oldestTimestamp = null;
        for (let key in serviceResults[serviceName]) {
            let serviceResult = serviceResults[serviceName][key];
            serviceStatusOverTime = createStatusBadge(serviceGroup, serviceName, key, serviceResult.success) + serviceStatusOverTime;
            const responseTime = parseInt(serviceResult.duration/1000000);
            if (minResponseTime == null || minResponseTime > responseTime) {
                minResponseTime = responseTime;
            }
            if (maxResponseTime == null || maxResponseTime < responseTime) {
                maxResponseTime = responseTime;
            }
            const timestamp = new Date(serviceResult.timestamp);
            if (newestTimestamp == null || newestTimestamp < timestamp) {
                newestTimestamp = timestamp;
            }
            if (oldestTimestamp == null || oldestTimestamp > timestamp) {
                oldestTimestamp = timestamp;
            }
        }
        output += ""
            + "<div id='" + serviceGroup + "-items' class='container py-3 border-left border-right border-top border-black'>"
            + "  <div class='row mb-2'>"
            + "    <div class='col-md-10'>"
            + "      <span class='font-weight-bold'>" + serviceName + "</span> <span class='text-secondary font-weight-lighter'>- " + hostname + "</span>"
            + "    </div>"
            + "    <div class='col-md-2 text-right'>"
            + "      <span class='font-weight-lighter status-min-max-ms'>" + (minResponseTime === maxResponseTime ? minResponseTime : (minResponseTime + "-" + maxResponseTime)) + "ms</span>"
            + "    </div>"
            + "  </div>"
            + "  <div class='row'>"
            + "    <div class='col-12 d-flex flex-row-reverse status-over-time'>"
            + "      " + serviceStatusOverTime
            + "    </div>"
            + "  </div>"
            + "  <div class='row status-time-ago'>"
            + "    <div class='col-6'>"
            + "      " + generatePrettyTimeAgo(oldestTimestamp)
            + "    </div>"
            + "    <div class='col-6 text-right'>"
            + "      " + generatePrettyTimeAgo(newestTimestamp)
            + "    </div>"
            + "  </div>"
            + "</div>";
    }
    let finalOutput = ""
    let visibility = ""

    if (active === "active"){
        visibility = "show active"
    }

    finalOutput = ""
            + "<div class='tab-pane fade " + visibility +  "' role='tabpanel' aria-labelledby='" + serviceGroup + "-tab' id='" + serviceGroup + "'>" 
            + output
            + "</div>";

    $("#results").append(finalOutput);
}

function prettifyTimestamp(timestamp) {
    let date = new Date(timestamp);
    let YYYY = date.getFullYear();
    let MM = ((date.getMonth()+1)<10?"0":"")+""+(date.getMonth()+1);
    let DD = ((date.getDate())<10?"0":"")+""+(date.getDate());
    let hh = ((date.getHours())<10?"0":"")+""+(date.getHours());
    let mm = ((date.getMinutes())<10?"0":"")+""+(date.getMinutes());
    let ss = ((date.getSeconds())<10?"0":"")+""+(date.getSeconds());
    return YYYY + "-" + MM + "-" + DD + " " + hh + ":" + mm + ":" + ss;
}

function generatePrettyTimeAgo(t) {
    let differenceInMs = new Date().getTime() - new Date(t).getTime();
    if (differenceInMs > 3600000) {
        let hours = (differenceInMs/3600000).toFixed(0);
        return hours + " hour" + (hours !== "1" ? "s" : "") + " ago";
    }
    if (differenceInMs > 60000) {
        let minutes = (differenceInMs/60000).toFixed(0);
        return minutes + " minute" + (minutes !== "1" ? "s" : "") + " ago";
    }
    return (differenceInMs/1000).toFixed(0) + " seconds ago";
}

function htmlEntities(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function setRefreshInterval(seconds) {
    refreshResults();
    refreshIntervalHandler = setInterval(function() {
        refreshResults();
    }, seconds * 1000)
}

$("#refresh-rate").change(function() {
    clearInterval(refreshIntervalHandler);
    setRefreshInterval($(this).val())
});

setRefreshInterval(30);

$("#refresh-rate").val(30);