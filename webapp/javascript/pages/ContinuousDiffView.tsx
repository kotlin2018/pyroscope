import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@webapp/redux/hooks';
import Box from '@webapp/ui/Box';
import {
  fetchDiffView,
  selectContinuousState,
  actions,
  fetchTagValues,
  selectQueries,
} from '@webapp/redux/reducers/continuous';
import { FlamegraphRenderer } from '@pyroscope/flamegraph';
import usePopulateLeftRightQuery from '@webapp/hooks/populateLeftRightQuery.hook';
import useTimelines, {
  leftColor,
  rightColor,
} from '@webapp/hooks/timeline.hook';
import useTimeZone from '@webapp/hooks/timeZone.hook';
import useColorMode from '@webapp/hooks/colorMode.hook';
import useTags from '@webapp/hooks/tags.hook';
import Toolbar from '@webapp/components/Toolbar';
import TagsBar from '@webapp/components/TagsBar';
import TimelineChartWrapper from '@webapp/components/TimelineChartWrapper';
import InstructionText from '@webapp/components/InstructionText';
import useExportToFlamegraphDotCom from '@webapp/components/exportToFlamegraphDotCom.hook';
import ExportData from '@webapp/components/ExportData';

function ComparisonDiffApp() {
  const dispatch = useAppDispatch();
  const { colorMode } = useColorMode();
  const {
    diffView,
    refreshToken,
    maxNodes,
    leftFrom,
    rightFrom,
    leftUntil,
    rightUntil,
  } = useAppSelector(selectContinuousState);
  const { leftQuery, rightQuery } = useAppSelector(selectQueries);

  usePopulateLeftRightQuery();
  const { leftTags, rightTags } = useTags({ leftQuery, rightQuery });
  const { leftTimeline, rightTimeline } = useTimelines();

  const exportToFlamegraphDotComFn = useExportToFlamegraphDotCom(
    diffView.profile
  );

  const { offset } = useTimeZone();
  const timezone = offset === 0 ? 'utc' : 'browser';

  useEffect(() => {
    if (rightQuery && leftQuery) {
      const fetchData = dispatch(
        fetchDiffView({
          leftQuery,
          leftFrom,
          leftUntil,

          rightQuery,
          rightFrom,
          rightUntil,
        })
      );
      return fetchData.abort;
    }
    return undefined;
  }, [
    leftFrom,
    leftUntil,
    leftQuery,
    rightFrom,
    rightUntil,
    rightQuery,
    refreshToken,
    maxNodes,
  ]);

  const exportData = diffView.profile && (
    <ExportData
      flamebearer={diffView.profile}
      exportJSON
      exportPNG
      // disable this until we fix it
      //      exportHTML
      exportFlamegraphDotCom
      exportFlamegraphDotComFn={exportToFlamegraphDotComFn}
    />
  );

  return (
    <div>
      <div className="main-wrapper">
        <Toolbar
          hideTagsBar
          onSelectedName={(query) => {
            dispatch(actions.setRightQuery(query));
            dispatch(actions.setLeftQuery(query));
            dispatch(actions.setQuery(query));
          }}
        />
        <Box>
          <TimelineChartWrapper
            data-testid="timeline-main"
            id="timeline-chart-diff"
            format="lines"
            height="125px"
            timelineA={leftTimeline}
            timelineB={rightTimeline}
            onSelect={(from, until) => {
              dispatch(actions.setFromAndUntil({ from, until }));
            }}
            markings={{
              left: { from: leftFrom, to: leftUntil, color: leftColor },
              right: { from: rightFrom, to: rightUntil, color: rightColor },
            }}
            timezone={timezone}
          />
        </Box>
        <Box>
          <div className="diff-instructions-wrapper">
            <div className="diff-instructions-wrapper-side">
              <TagsBar
                query={leftQuery}
                tags={leftTags}
                onSetQuery={(q) => {
                  dispatch(actions.setLeftQuery(q));
                }}
                onSelectedLabel={(label, query) => {
                  dispatch(fetchTagValues({ query, label }));
                }}
              />
              <InstructionText viewType="diff" viewSide="left" />
              <TimelineChartWrapper
                data-testid="timeline-left"
                key="timeline-chart-left"
                id="timeline-chart-left"
                timelineA={leftTimeline}
                onSelect={(from, until) => {
                  dispatch(actions.setLeft({ from, until }));
                }}
                markings={{
                  left: { from: leftFrom, to: leftUntil, color: leftColor },
                }}
                timezone={timezone}
              />
            </div>
            <div className="diff-instructions-wrapper-side">
              <TagsBar
                query={rightQuery}
                tags={rightTags}
                onSetQuery={(q) => {
                  dispatch(actions.setRightQuery(q));
                }}
                onSelectedLabel={(label, query) => {
                  dispatch(fetchTagValues({ query, label }));
                }}
              />
              <InstructionText viewType="diff" viewSide="right" />
              <TimelineChartWrapper
                data-testid="timeline-right"
                key="timeline-chart-right"
                id="timeline-chart-right"
                timelineA={rightTimeline}
                onSelect={(from, until) => {
                  dispatch(actions.setRight({ from, until }));
                }}
                markings={{
                  right: { from: rightFrom, to: rightUntil, color: rightColor },
                }}
                timezone={timezone}
              />
            </div>
          </div>
          <FlamegraphRenderer
            profile={diffView.profile}
            ExportData={exportData}
            colorMode={colorMode}
          />
        </Box>
      </div>
    </div>
  );
}

export default ComparisonDiffApp;
