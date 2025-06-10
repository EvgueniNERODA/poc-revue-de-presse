"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  LoaderCircle,
  CircleCheck,
  TextSearch,
  Download,
  Trash,
  RotateCcw,
  NotebookText,
} from "lucide-react";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useDeepResearch from "@/hooks/useDeepResearch";
import useKnowledge from "@/hooks/useKnowledge";
import { useTaskStore, type Task } from "@/store/task";
import { useKnowledgeStore } from "@/store/knowledge";
import { downloadFile } from "@/utils/file";
import { renderToStaticMarkup } from 'react-dom/server';
import useWebSearch from "@/hooks/useWebSearch";

const MagicDown = dynamic(() => import("@/components/MagicDown"));
const MagicDownView = dynamic(() => import("@/components/MagicDown/View"));
const Lightbox = dynamic(() => import("@/components/Internal/Lightbox"));

const formSchema = z.object({
  suggestion: z.string().optional(),
});

function addQuoteBeforeAllLine(text: string = "") {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function TaskState({ state }: { state: Task["state"] }) {
  if (state === "completed") {
    return <CircleCheck className="h-5 w-5" />;
  } else if (state === "processing") {
    return <LoaderCircle className="animate-spin h-5 w-5" />;
  } else {
    return <TextSearch className="h-5 w-5" />;
  }
}

function SearchResult() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, reviewSearchResult } = useDeepResearch();
  const { search: webSearch } = useWebSearch();
  const { generateId } = useKnowledge();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<{
    startDate?: string;
    endDate?: string;
    allowedSites?: string[];
  }>({});
  const unfinishedTasks = useMemo(() => {
    return taskStore.tasks.filter((item) => item.state !== "completed");
  }, [taskStore.tasks]);
  const taskFinished = useMemo(() => {
    return taskStore.tasks.length > 0 && unfinishedTasks.length === 0;
  }, [taskStore.tasks, unfinishedTasks]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      suggestion: taskStore.suggestion,
    },
  });

  const handleSearch = async () => {
    if (!taskStore.suggestion.trim()) return;

    const task: Task = {
      query: taskStore.suggestion,
      researchGoal: taskStore.suggestion,
      state: "unprocessed",
      learning: "",
      sources: [],
      images: [],
    };

    taskStore.updateTask(task.query, task);

    try {
      const filters = {
        startDate: searchFilters.startDate ? new Date(searchFilters.startDate).toISOString() : undefined,
        endDate: searchFilters.endDate ? new Date(searchFilters.endDate).toISOString() : undefined,
        allowedSites: searchFilters.allowedSites && searchFilters.allowedSites.length > 0 ? searchFilters.allowedSites : undefined,
      };

      const results = await webSearch(taskStore.suggestion, filters);
      const newTask: Task = {
        ...task,
        state: "completed",
        sources: results.sources || [],
        images: results.images || [],
      };
      taskStore.updateTask(task.query, newTask);
    } catch (error) {
      console.error("Search failed:", error);
      const failedTask: Task = { ...task, state: "failed" };
      taskStore.updateTask(task.query, failedTask);
    }
  };

  const getSearchResultContent = (item: Task): React.ReactNode => {
    const sources = item.sources || [];
    const images = item.images || [];
    return (
      <div className="space-y-4">
        {sources.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Sources</h3>
            <ul className="list-disc pl-5 space-y-2">
              {sources.map((source: Source, index: number) => (
                <li key={index}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {images.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Images</h3>
            <div className="grid grid-cols-2 gap-4">
              {images.map((image: ImageSource, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={image.description || "Image"}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {image.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {image.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { setSuggestion } = useTaskStore.getState();
    try {
      accurateTimerStart();
      setIsThinking(true);
      if (unfinishedTasks.length > 0) {
        await handleSearch();
      } else {
        if (values.suggestion) setSuggestion(values.suggestion);
        await reviewSearchResult();
        // Clear previous research suggestions
        setSuggestion("");
      }
    } finally {
      setIsThinking(false);
      accurateTimerStop();
    }
  }

  function addToKnowledgeBase(item: Task) {
    const { save } = useKnowledgeStore.getState();
    const currentTime = Date.now();
    const content = renderToStaticMarkup(getSearchResultContent(item));
    save({
      id: generateId("knowledge"),
      title: item.query,
      content,
      type: "knowledge",
      createdAt: currentTime,
      updatedAt: currentTime,
    });
    toast.message(t("research.common.addToKnowledgeBaseTip"));
  }

  async function handleRetry(query: string, researchGoal: string) {
    const { updateTask } = useTaskStore.getState();
    const newTask: Task = {
      query,
      researchGoal,
      learning: "",
      sources: [],
      images: [],
      state: "unprocessed",
    };
    updateTask(query, newTask);
    await handleSearch();
  }

  function handleRemove(query: string) {
    const { removeTask } = useTaskStore.getState();
    removeTask(query);
  }

  useEffect(() => {
    form.setValue("suggestion", taskStore.suggestion);
  }, [taskStore.suggestion, form]);

  return (
    <section className="p-4 border rounded-md mt-4 print:hidden">
      <h3 className="font-semibold text-lg border-b mb-2 leading-10">
        {t("research.searchResult.title")}
      </h3>
      {taskStore.tasks.length === 0 ? (
        <div>{t("research.searchResult.emptyTip")}</div>
      ) : (
        <div>
          <Accordion className="mb-4" type="multiple">
            {taskStore.tasks.map((item, idx) => {
              return (
                <AccordionItem key={idx} value={item.query}>
                  <AccordionTrigger>
                    <div className="flex">
                      <TaskState state={item.state} />
                      <span className="ml-1">{item.query}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-slate dark:prose-invert max-w-full min-h-20">
                    <MagicDownView>
                      {addQuoteBeforeAllLine(item.researchGoal)}
                    </MagicDownView>
                    <Separator className="mb-4" />
                    <MagicDown
                      value={item.learning}
                      onChange={(value) =>
                        taskStore.updateTask(item.query, { learning: value })
                      }
                      tools={
                        <>
                          <div className="px-1">
                            <Separator className="dark:bg-slate-700" />
                          </div>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.restudy")}
                            side="left"
                            sideoffset={8}
                            onClick={() =>
                              handleRetry(item.query, item.researchGoal)
                            }
                          >
                            <RotateCcw />
                          </Button>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.delete")}
                            side="left"
                            sideoffset={8}
                            onClick={() => handleRemove(item.query)}
                          >
                            <Trash />
                          </Button>
                          <div className="px-1">
                            <Separator className="dark:bg-slate-700" />
                          </div>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.addToKnowledgeBase")}
                            side="left"
                            sideoffset={8}
                            onClick={() => addToKnowledgeBase(item)}
                          >
                            <NotebookText />
                          </Button>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.export")}
                            side="left"
                            sideoffset={8}
                            onClick={() =>
                              downloadFile(
                                renderToStaticMarkup(getSearchResultContent(item)),
                                `${item.query}.md`,
                                "text/markdown;charset=utf-8"
                              )
                            }
                          >
                            <Download />
                          </Button>
                        </>
                      }
                    ></MagicDown>
                    {item.images && item.images.length > 0 && (
                      <>
                        <hr className="my-6" />
                        <h4>{t("research.searchResult.relatedImages")}</h4>
                        <Lightbox data={item.images} />
                      </>
                    )}
                    {item.sources && item.sources.length > 0 && (
                      <>
                        <hr className="my-6" />
                        <h4>{t("research.common.sources")}</h4>
                        <ol>
                          {item.sources.map((source, idx) => (
                            <li className="ml-2" key={idx}>
                              <a href={source.url} target="_blank">
                                {source.title || source.url}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="suggestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2 font-semibold">
                      {t("research.searchResult.suggestionLabel")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t(
                          "research.searchResult.suggestionPlaceholder"
                        )}
                        disabled={isThinking}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                className="w-full mt-4"
                type="submit"
                variant="default"
                disabled={isThinking}
              >
                {isThinking ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    <span>{status}</span>
                    <small className="font-mono">{formattedTime}</small>
                  </>
                ) : taskFinished ? (
                  t("research.common.indepthResearch")
                ) : (
                  t("research.common.continueResearch")
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </section>
  );
}

export default SearchResult;
