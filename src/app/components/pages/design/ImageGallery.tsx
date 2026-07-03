'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Spin, notification, message,Image as AntdImage } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { API_CONFIG } from '@/config/constants';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { api } from '@/lib/api';
import ImageUpload from '../../ImageUpload';
import SortableImage from '../../common/SortableImage';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

interface SortedImageItem {
  id: string;
  src: string;
  type: 'existing' | 'uploaded';
  originalIndex: number;
  originalPath?: string;
  originalFile?: UploadFile;
}

interface ImageGalleryProps {
  currentFolderPath: string;
  coverPath: string;
  designId: number;
  onBackToDetail: () => void;
  onImageModify: (formData: FormData) => Promise<void>;
}

export default function ImageGallery({
  currentFolderPath,
  coverPath,
  designId,
  onBackToDetail,
  onImageModify
}: ImageGalleryProps) {
  const { t } = useTranslation();
  
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imgList, setImgList] = useState<string[]>([]);
  const [cover, setCover] = useState<UploadFile[]>([]);
  const [deleteList, setDeleteList] = useState<string[]>([]);
  const [restList, setRestList] = useState<string[]>([]);
  const [uploadList, setUploadList] = useState<UploadFile[]>([]);
  const [modifyMode, setModifyMode] = useState(false);
  
  const [sortedImageList, setSortedImageList] = useState<SortedImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateSortedImageList = useCallback(() => {
    const existingImages = restList.map((src, index) => ({
      id: `existing-${src}-${index}`,
      src: API_CONFIG.BASE_URL + src,
      type: 'existing' as const,
      originalPath: src,
      originalIndex: index
    }));
    
    const uploadedImages = uploadList.map((img, index) => ({
      id: `upload-${img.uid}-${index}`,
      src: img.url || (img.originFileObj ? URL.createObjectURL(img.originFileObj) : ''),
      type: 'uploaded' as const,
      originalFile: img,
      originalIndex: index
    }));
    
    setSortedImageList([...existingImages, ...uploadedImages]);
  }, [restList, uploadList]);

  useEffect(() => {
    updateSortedImageList();
  }, [updateSortedImageList]);

  const fetchImageList = async (folderPath: string) => {
    try {
      setImagesLoading(true);
      const response = await api.file.getList(folderPath);
      if (response.code === 200) {
        setImgList(response.data);
        setRestList(response.data);
        setDeleteList([]);
        setUploadList([]);
      } else {
        notification.error({
          message: t('fetchImagesFailed'),
          description: response.msg || t('unableToFetchImageList'),
          placement: 'topRight',
        });
      }
    } catch (error) {
      console.error('Fetch image list failed:', error);
      notification.error({
        message: t('fetchImagesFailed'),
        description: t('fetchImageListFailed'),
        placement: 'topRight',
      });
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    if (currentFolderPath) {
      setCover([{ url: API_CONFIG.BASE_URL + coverPath } as UploadFile]);
      fetchImageList(currentFolderPath);
    }
  }, [currentFolderPath, coverPath]);

  const handleDragStart = (event: any) => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setIsDragging(false);

    if (active.id !== over.id) {
      const oldIndex = sortedImageList.findIndex((item) => item.id === active.id);
      const newIndex = sortedImageList.findIndex((item) => item.id === over.id);
      
      const newSortedItems = arrayMove(sortedImageList, oldIndex, newIndex);
      setSortedImageList(newSortedItems);
      
      const newRestList: string[] = [];
      const newUploadList: UploadFile[] = [];
      
      newSortedItems.forEach((item) => {
        if (item.type === 'existing' && item.originalPath) {
          newRestList.push(item.originalPath);
        } else if (item.type === 'uploaded' && item.originalFile) {
          newUploadList.push(item.originalFile);
        }
      });
      
      setRestList(newRestList);
      setUploadList(newUploadList);
    }
  };

  const handleDeleteImageById = (imageId: string) => {
    if (restList.length + uploadList.length <= 1) {
      notification.error({
        message: t('deleteFailed'),
        description: t('atLeastOneImage'),
        placement: 'topRight',
      });
      return;
    }

    const imageItem = sortedImageList.find(item => item.id === imageId);
    if (!imageItem) return;

    if (imageItem.type === 'existing') {
      const newRestList = restList.filter((_, i) => i !== imageItem.originalIndex);
      setRestList(newRestList);
      setDeleteList([...deleteList, restList[imageItem.originalIndex]]);
    } else {
      const newUploadList = uploadList.filter((_, i) => i !== imageItem.originalIndex);
      setUploadList(newUploadList);
    }
  };

  const handleCancelModify = () => {
    setModifyMode(false);
    setRestList(imgList);
    setDeleteList([]);
    setUploadList([]);
    setSortedImageList([]);
  };

  const handleImageModify = async () => {
    try {
      const hasCover = cover.length > 0 && cover[0]?.originFileObj;
      const hasImages = restList.length > 0 || uploadList.length > 0;
      const totalImages = restList.length + uploadList.length;
      
      if (totalImages === 0) {
        notification.error({
          message: t('validationFailed'),
          description: t('atLeastOneImageInCollection'),
          placement: 'topRight',
        });
        return;
      }

      const formData = new FormData();
      
      uploadList.forEach((img: any) => {
        formData.append('addFiles', img.originFileObj as RcFile);
      });
      
      deleteList.forEach((url: any) => {
        formData.append('deleteFiles', url);
      });
      
      formData.append('designId', designId.toString());
      
      if (cover[0]?.originFileObj) {
        formData.append('previewPhoto', cover[0].originFileObj);
      }

      await onImageModify(formData);
      message.success(t('modifySuccess'));
      setModifyMode(false);
      fetchImageList(currentFolderPath);
    } catch (error) {
      console.error('Modify images failed:', error);
      notification.error({
        message: t('modifyFailed'),
        description: t('modifyImagesFailed'),
        placement: 'topRight',
      });
    }
  };

  const handleDownloadImages = async () => {
    try {
      window.open(API_CONFIG.BASE_URL + currentFolderPath);
    } catch (error) {
      console.error('Download failed:', error);
      notification.error({
        message: t('downloadFailed'),
        description: t('downloadImagesFailed'),
        placement: 'topRight',
      });
    }
  };

  return (
    <div className="p-6">
      <div 
        onClick={onBackToDetail} 
        style={{ color: "#ee8d20", fontWeight: 600, cursor: "pointer", marginBottom: 20 }}
      >
        <LeftOutlined /> {t('back')}
      </div>
      
      <Spin spinning={imagesLoading}>
        {modifyMode ? (
          <>
            <section style={{ display: "flex", flexWrap: "wrap", marginTop: 20, marginBottom: 50 }}>
              <span style={{ marginRight: 10 }}>{t('coverColon')} </span>
              <ImageUpload changePic={setCover} value={cover} maxCount={1} />
            </section>
            <section style={{ marginTop: 20, marginBottom: 50 }}>
              <span style={{ marginRight: 10, display: "block", marginBottom: 10 }}>{t('imagesColon')} </span>
              {sortedImageList.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sortedImageList.map(item => item.id)} strategy={rectSortingStrategy}>
                    <div 
                      style={{ 
                        display: "flex", 
                        flexWrap: "wrap",
                        opacity: isDragging ? 0.8 : 1,
                        transition: "opacity 0.2s ease"
                      }}
                    >
                      {sortedImageList.map((item) => (
                        <SortableImage
                          key={item.id}
                          id={item.id}
                          src={item.src}
                          onDelete={() => handleDeleteImageById(item.id)}
                          isUploaded={item.type === 'uploaded'}
                        />
                      ))}
                    </div>
                    {isDragging && (
                      <div
                        style={{
                          position: "fixed",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: "rgba(24, 144, 255, 0.9)",
                          color: "white",
                          padding: "12px 24px",
                          borderRadius: "8px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          zIndex: 9999,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          pointerEvents: "none"
                        }}
                      >
                        🖼️ {t('dragToReorder')}
                      </div>
                    )}
                  </SortableContext>
                </DndContext>
              ) : (
                <div style={{ color: '#999', fontStyle: 'italic' }}>{t('noImages')}</div>
              )}
            </section>
            <section style={{ display: "flex", flexWrap: "wrap", marginTop: 20, marginBottom: 50 }}>
              <span style={{ marginRight: 10 }}>{t('addImages')} </span>
              <ImageUpload 
                changePic={(newFiles) => {
                  setUploadList(prev => [...prev, ...newFiles]);
                }} 
              />
            </section>
            <Button style={{ marginTop: 20 }} onClick={handleImageModify}>
              {t('confirm')}
            </Button>
            <Button style={{ marginTop: 20, marginLeft: 20 }} onClick={handleCancelModify}>
              {t('cancel')}
            </Button>
          </>
        ) : (
          <>
            <section style={{ display: "flex", flexWrap: "wrap", marginTop: 20 }}>
              {t('coverColon')}
              <AntdImage 
                style={{ width: 200 }} 
                src={cover[0]?.url || API_CONFIG.BASE_URL + coverPath}
                alt={t('cover')}
                preview={{src:API_CONFIG.BASE_URL + coverPath}}
              />
            </section>
            <section style={{ display: "flex", flexWrap: "wrap", marginTop: 20 }}>
              {t('imagesColon')}
              {imgList.map((res: any) => (
                <div key={res} style={{ width: 200, marginRight: 20, cursor: "pointer" }}>
                  <AntdImage 
                    style={{ width: "100%" }} 
                    src={API_CONFIG.BASE_URL + res}
                    alt={t('productImage')}
                    preview={{src:API_CONFIG.BASE_URL + res}}
                  />
                </div>
              ))}
            </section>
            <Button style={{ marginTop: 20, marginRight: 20 }} onClick={() => setModifyMode(true)}>
              {t('edit')}
            </Button>
            <Button style={{ marginTop: 20 }} onClick={handleDownloadImages}>
              {t('download')}
            </Button>
          </>
        )}
      </Spin>
    </div>
  );
}
