import React, { useEffect } from 'react';
import 'react-dom';

import { useAppDispatch, useAppSelector } from '@webapp/redux/hooks';
import Box from '@webapp/ui/Box';
import { FlamegraphRenderer } from '@pyroscope/flamegraph';
import {
  fetchSingleView,
  setDateRange,
} from '@webapp/redux/reducers/continuous';
import useColorMode from '@webapp/hooks/colorMode.hook';
import TimelineChartWrapper from '@webapp/components/TimelineChartWrapper';
import Toolbar from '@webapp/components/Toolbar';
import ExportData from '@webapp/components/ExportData';
import useExportToFlamegraphDotCom from '@webapp/components/exportToFlamegraphDotCom.hook';
import useTimeZone from '@webapp/hooks/timeZone.hook';

function ContinuousSingleView() {
  const dispatch = useAppDispatch();
  const { offset } = useTimeZone();
  const { colorMode } = useColorMode();

  const { from, until, query, refreshToken, maxNodes } = useAppSelector(
    (state) => state.continuous
  );

  const { singleView } = useAppSelector((state) => state.continuous);

  useEffect(() => {
    if (from && until && query && maxNodes) {
      const fetchData = dispatch(fetchSingleView(null));
      return () => fetchData.abort('cancel');
    }
    return undefined;
  }, [from, until, query, refreshToken, maxNodes]);

  const getRaw = () => {
    switch (singleView.type) {
      case 'loaded':
      case 'reloading': {
        return singleView.profile;
      }

      default: {
        return undefined;
      }
    }
  };
  const exportToFlamegraphDotComFn = useExportToFlamegraphDotCom(getRaw());

  const flamegraphRenderer = (() => {
    switch (singleView.type) {
      case 'loaded':
      case 'reloading': {
        return (
          <FlamegraphRenderer
            profile={singleView.profile}
            colorMode={colorMode}
            ExportData={
              <ExportData
                flamebearer={singleView.profile}
                exportPNG
                exportJSON
                exportPprof
                exportHTML
                exportFlamegraphDotCom
                exportFlamegraphDotComFn={exportToFlamegraphDotComFn}
              />
            }
          />
        );
      }

      default: {
        return 'Loading';
      }
    }
  })();

  const getTimeline = () => {
    switch (singleView.type) {
      case 'loaded':
      case 'reloading': {
        return {
          data: singleView.timeline,
        };
      }

      default: {
        return {
          data: undefined,
        };
      }
    }
  };

  return (
    <div>
      <div className="main-wrapper">
        <Toolbar />
        <Box>
          <TimelineChartWrapper
            timezone={offset === 0 ? 'utc' : 'browser'}
            data-testid="timeline-single"
            id="timeline-chart-single"
            timelineA={getTimeline()}
            onSelect={(from, until) => dispatch(setDateRange({ from, until }))}
            height="125px"
          />
        </Box>
        <Box>{flamegraphRenderer}</Box>
      </div>
    </div>
  );
}

export default ContinuousSingleView;
