package load

import (
	"time"

	"github.com/pyroscope-io/pyroscope/pkg/storage"
	"github.com/pyroscope-io/pyroscope/pkg/storage/metadata"
	"github.com/pyroscope-io/pyroscope/pkg/storage/segment"
)

type App struct {
	Name            string
	SpyName         string
	SampleRate      uint32
	Units           metadata.Units
	AggregationType metadata.AggregationType

	tags  *TagsGenerator
	trees *TreeGenerator
}

type AppConfig struct {
	SpyName         string                   `yaml:"spyName"`
	SampleRate      uint32                   `yaml:"sampleRate"`
	Units           metadata.Units           `yaml:"units"`
	AggregationType metadata.AggregationType `yaml:"aggregationType"`

	Tags       []Tag `yaml:"tags"`
	Trees      int   `yaml:"trees"`
	TreeConfig `yaml:"treeConfig"`
}

type Tag struct {
	Name        string `yaml:"name"`
	Cardinality int    `yaml:"cardinality"`
	MinLen      int    `yaml:"minLen"`
	MaxLen      int    `yaml:"maxLen"`
}

func NewApp(seed int, name string, c AppConfig) *App {
	a := App{
		Name:            name,
		SpyName:         c.SpyName,
		SampleRate:      c.SampleRate,
		Units:           c.Units,
		AggregationType: c.AggregationType,
	}
	a.trees = NewTreeGenerator(seed, c.Trees, c.TreeConfig)
	a.tags = NewTagGenerator(seed, name)
	for _, t := range c.Tags {
		a.tags.Add(t.Name, t.Cardinality, t.MinLen, t.MaxLen)
	}
	return &a
}

func (a *App) CreatePutInput(from, to time.Time) *storage.PutInput {
	return &storage.PutInput{
		StartTime:       from,
		EndTime:         to,
		Key:             segment.NewKey(a.tags.Next()),
		Val:             a.trees.Next(),
		SpyName:         a.SpyName,
		SampleRate:      a.SampleRate,
		Units:           a.Units,
		AggregationType: a.AggregationType,
	}
}
